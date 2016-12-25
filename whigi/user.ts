/**
 * API dealing with users, their profile and registration.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var https = require('https');
var ndm = require('nodemailer');
var utils = require('../utils/utils');
var checks = require('../utils/checks');
var pem = require('pem');
var hash = require('js-sha256');
var aes = require('aes-js');
var fs = require('fs');
import * as data from './data';
import {User} from '../common/models/User';
import {Datafragment} from '../common/models/Datafragment';
import {Token} from '../common/models/Token';
import {Oauth} from '../common/models/Oauth';
import {Vault} from '../common/models/Vault';
import {Datasource} from '../common/Datasource';
import {RSAPool} from '../utils/RSAPool';
var mailer, oid: {[id: string]: string[]}, size: number;
var db: Datasource;
var rsa: RSAPool;

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
 * @param {Datasource} dbg Database.
 */
export function managerInit(dbg: Datasource) {
    mailer = ndm.createTransport({
        service: 'Gmail',
        auth: {
            user: 'whigi.com@gmail.com',
            pass: 'nNP36gFYmMeND3dIoKwR'
        }
    });
    db = dbg;
    rsa = new RSAPool(10, 1024, false);
    oid = {};
    size = 0;
}

/**
 * Forges the response to some user info as json.
 * @function peekUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function peekUser(req, res) {
    var dec = req.params.id.toLowerCase();
    if(dec == 'whigi-dev-null') {
        res.type('application/json').status(200).json({error: ''});
    } else {
        db.retrieveUser(dec).then(function(user: User) {
            if(!!user) {
                res.type('application/json').status(200).json({error: ''});
            } else {
                res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
            }
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
}

/**
 * Forges the response to some user info as json when connected.
 * @function getUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getUser(req, res) {
    var dec = req.params.id.toLowerCase();
    if(dec == 'whigi-dev-null') {
        res.type('application/json').status(200).json({
            _id: 'whigi-dev-null',
            rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
            is_company: 9,
            company_info: {
                name: 'Whigi and Wissl Void Account',
                request: {'Whigi': 'requests.whigiLine'}
            },
            hidden_id: 'shortersook4',
        });
    } else {
        db.retrieveUser(dec).then(function(user: User) {
            if(!!user) {
                res.type('application/json').status(200).json(user.sanitarize());
            } else {
                res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
            }
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
}

/**
 * Forges the response to the authenticated user info as json, or HTTP 500 code.
 * @function getProfile
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getProfile(req, res) {
    res.type('application/json').status(200).json(req.user.fields());
}

/**
 * Closes an account to another profile.
 * @function closeTo
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function closeTo(req, res) {
    var new_keys: number[][] = req.body.new_keys;
    var dec = req.params.id.toLowerCase();
    var changes = {};

    function end(nu: User) {
        Object.getOwnPropertyNames(changes).forEach(function(key) {
            if(key != req.user._id) {
                db.retrieveUser(key, true).then(function(user: User) {
                    if(!!user) {
                        var fs = Object.getOwnPropertyNames(changes[key]);
                        for(var j = 0; j < fs.length; j++) {
                            var id = user.data[fs[j]].shared_to[req.user._id];
                            delete user.data[fs[j]].shared_to[req.user._id];
                            if(changes[key][fs[j]])
                                user.data[fs[j]].shared_to[nu._id] = id;
                        }
                        user.persist();
                    }
                });
            }
        });
        nu.persist();
    }

    if(dec == req.user._id || checks.isWhigi(dec) || checks.isWhigi(req.user._id)) {
        res.type('application/json').status(403).json({puzzle: req.user.puzzle, error: utils.i18n('client.auth', req)});
        return;
    }
    db.retrieveUser(dec, true).then(function(user: User) {
        if(!!user) {
            if('whigi-system' in user.shared_with_me) {
                res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                return;
            }
            //Append RSA private keys
            for(var i = 0; i < new_keys.length; i++)
                user.rsa_pri_key.push(new_keys[i]);
            //Append Hidden ID
            user.hidden_id += req.user.hidden_id;
            //Save granted user
            user.persist().then(function() {
                var keys = Object.getOwnPropertyNames(req.user.shared_with_me), done = 0;
                function towards() {
                    done++;
                    if(done >= keys.length) {
                        end(user);
                    }
                }
                for(var i = 0; i < keys.length; i++) {
                    var fs = Object.getOwnPropertyNames(req.user.shared_with_me[keys[i]]), num = 0;
                    function pre() {
                        num++;
                        if(num >= fs.length) {
                            towards();
                        }
                    }
                    for(var j = 0; j < fs.length; j++) {
                        db.retrieveVault(req.user.shared_with_me[keys[i]][fs[j]]).then(function(v: Vault) {
                            if(!!v) {
                                v.shared_to_id = dec;
                                v.persist();
                                changes[v.sharer_id] = changes[v.sharer_id] || {};
                                //Give transient, junk...
                                if(!user.shared_with_me[v.sharer_id] || !user.shared_with_me[v.sharer_id][v.data_name]) {
                                    //New user did not have this data from remote user
                                    user.shared_with_me[v.sharer_id] = user.shared_with_me[v.sharer_id] || {};
                                    user.shared_with_me[v.sharer_id][v.data_name] = v._id;
                                    changes[v.sharer_id][v.real_name] = true;
                                } else {
                                    //New user already had this data!
                                    changes[v.sharer_id][v.real_name] = false;
                                }
                            }
                            pre();
                        }, function(e) {
                            pre();
                        });
                    }
                    if(fs.length == 0) {
                        towards();
                    }
                }
                req.user.company_info.is_closed = true;
                req.user.persist();
                res.type('application/json').status(200).json({puzzle: req.user.puzzle});
            }, function(e) {
                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
            });
        } else {
            res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noUser', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
    });
}

/**
 * Go Company.
 * @function goCompany1
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function goCompany1(req, res) {
    if(checks.isWhigi(req.user._id)) {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        return;
    }
    //Modify the picture does not change confidence
    if(!(Object.getOwnPropertyNames(req.body).length == 1) || !req.body.picture)
        req.user.is_company = 1;
    if(!!req.body.name)
        req.user.company_info.name = req.body.name;
    if(!!req.body.bce)
        req.user.company_info.bce = req.body.bce;
    if(!!req.body.rrn)
        req.user.company_info.rrn = req.body.rrn;
    if(!!req.body.address)
        req.user.company_info.address = req.body.address;
    if(!!req.body.picture)
        req.user.company_info.picture = req.body.picture;
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Set "MotD".
 * @function setRequests
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function setRequests(req, res) {
    if(checks.isWhigi(req.user._id)) {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        return;
    }
    if(req.body.request.constructor === Array) {
        for(var i = 0; i < req.body.request.length; i++) {
            if(req.body.request[i].constructor === Array) {
                req.user.company_info.request[req.body.request[i][0].toString()] = req.body.request[i][1].toString();
            }
        }
    }
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Set preferred language so far.
 * @function setLang
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function setLang(req, res) {
    if(checks.isWhigi(req.user._id)) {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        return;
    }
    req.user.company_info.lang = req.body.lang.toString().replace(/_.*$/g, '').toLowerCase();
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Prepares "Go Company".
 * @function prepGoCompany9
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function prepGoCompany9(req, res) {
    db.retrieveUser(req.query.username.toLowerCase()).then(function(user) {
        if(!!user) {
            if(hash.sha256(req.query.hpwd + user.salt) == user.password || hash.sha256(req.query.hpwd) == user.sha_master) {
                var uid = utils.generateRandomString(12) + '-' + (new Date).getTime();
                if(size >= 200) {
                    oid = {};
                }
                size++;
                oid[uid] = [req.query.username, req.query.toreturn];
                var redir = utils.RUNNING_ADDR + '/api/v1/eid/callback?req=' + uid;
                res.redirect('https://www.e-contract.be/eid-idp/protocol/openid/auth-ident?openid.ns=' + encodeURIComponent('http://specs.openid.net/auth/2.0')
                    + '&openid.claimed_id=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select') + '&openid.identity=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select')
                    + '&openid.return_to=' + encodeURIComponent(redir) + '&openid.realm=' + encodeURIComponent(redir) + '&openid.assoc_handle='
                    + encodeURIComponent('1474039082334-8') + '&openid.mode=checkid_setup&openid.ns.ax=' + encodeURIComponent('http://openid.net/srv/ax/1.0') + '&openid.ax.mode=fetch_request'
                    + '&openid.ax.type.attr1=' + encodeURIComponent('http://axschema.org/namePerson/first') + '&openid.ax.type.attr2=' + encodeURIComponent('http://openid.net/schema/birthDate/birthMonth')
                    + '&openid.ax.type.attr3=' + encodeURIComponent('http://axschema.org/eid/card-validity/end') + '&openid.ax.type.attr4=' + encodeURIComponent('http://axschema.org/person/gender')
                    + '&openid.ax.type.attr5=' + encodeURIComponent('http://axschema.org/contact/postalAddress/home') + '&openid.ax.type.attr6=' + encodeURIComponent('http://axschema.org/eid/cert/auth')
                    + '&openid.ax.type.attr7=' + encodeURIComponent('http://axschema.org/eid/photo') + '&openid.ax.type.attr8=' + encodeURIComponent('http://axschema.org/eid/card-validity/begin')
                    + '&openid.ax.type.attr9=' + encodeURIComponent('http://axschema.org/contact/city/home') + '&openid.ax.type.attr10=' + encodeURIComponent('http://axschema.org/contact/postalCode/home')
                    + '&openid.ax.type.attr11=' + encodeURIComponent('http://axschema.org/eid/age') + '&openid.ax.type.attr12=' + encodeURIComponent('http://axschema.org/birthDate')
                    + '&openid.ax.type.attr13=' + encodeURIComponent('http://openid.net/schema/birthDate/birthYear') + '&openid.ax.type.attr14=' + encodeURIComponent('http://axschema.org/eid/pob')
                    + '&openid.ax.type.attr15=' + encodeURIComponent('http://axschema.org/eid/card-number') + '&openid.ax.type.attr16=' + encodeURIComponent('http://axschema.org/eid/chip-number')
                    + '&openid.ax.type.attr17=' + encodeURIComponent('http://axschema.org/eid/nationality') + '&openid.ax.type.attr18=' + encodeURIComponent('http://axschema.org/eid/rrn')
                    + '&openid.ax.type.attr19=' + encodeURIComponent('http://openid.net/schema/birthDate/birthday') + '&openid.ax.type.attr20=' + encodeURIComponent('http://axschema.org/namePerson/last')
                    + '&openid.ax.type.attr21=' + encodeURIComponent('http://axschema.org/namePerson') + '&openid.ax.type.attr22=' + encodeURIComponent('http://openid.net/schema/namePerson/middle')
                    + '&openid.ax.type.attr23=' + encodeURIComponent('http://axschema.org/eid/documentType') + '&openid.ax.type.attr24=' + encodeURIComponent('http://axschema.org/eid/nobleCondition')
                    + '&openid.ax.required=attr1,attr2,attr3,attr4,attr5,attr6,attr7,attr8,attr9,attr10,attr11,attr12,attr13,attr14,attr15,attr16,attr17,attr18,attr19,attr20,attr21,attr22,attr23,attr24');
            } else {
                res.type('application/json').status(418).json({error: utils.i18n('client.auth', req)});
            }
        } else {
            res.type('application/json').status(418).json({error: utils.i18n('client.auth', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Go Company.
 * @function goCompany9
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function goCompany9(req, res) {
    if(req.query.req in oid) {
        var stamp = parseInt(req.query.req.split('-')[1]);
        if((new Date).getTime() - 60*1000 > stamp) {
            res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        } else {
            if(checks.isWhigi(oid[req.query.req][0])) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            if(!utils.DEBUG && !checks.eidSig(req.body)) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            db.retrieveUser(oid[req.query.req][0], true).then(function(u: User) {
                u.is_company = 9;
                u.company_info.name = req.body['openid.ax.value.attr21'];
                u.company_info.first_name = req.body['openid.ax.value.attr1'];
                u.company_info.last_name = req.body['openid.ax.value.attr20'];
                u.company_info.rrn = req.body['openid.ax.value.attr18'];
                var home: string[] = req.body['openid.ax.value.attr5'].trim().split(' ');
                var num = home.pop();
                u.company_info.address = JSON.stringify({
                    "generics.careof": req.body['openid.ax.value.attr21'],
                    "generics.street": home.join(' '),
                    "generics.num": num,
                    "generics.letterbox": "",
                    "generics.more": "",
                    "generics.postcode": req.body['openid.ax.value.attr10'],
                    "generics.city": req.body['openid.ax.value.attr9'],
                    "generics.country": "Belgium"
                });
                pem.createCertificate({
                    serviceKey: fs.readFileSync('./whigi/whigi-key.pem'),
                    days: 36500,
                    clientKey: u.rsa_pub_key,
                    country: 'BE',
                    state: '',
                    locality: req.body['openid.ax.value.attr9'],
                    organization: '',
                    organizationUnit: '',
                    commonName: req.body['openid.ax.value.attr21'],
                    emailAddress: ''
                }, function(e, keys) {
                    if(!e)
                        u.cert = keys.certificate;
                    u.persist().then(function() {
                        res.redirect('/profile/eidok?toreturn=' + oid[req.query.req][1]);
                    }, function(e) {
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    });
                });
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
        }
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Changes public name for admins.
 * @function goBCE
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function goBCE(req, res) {
    if(req.user.is_company != 9) {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        return;
    }

    var bce = req.params.bce.replace('.', '');
    var options = {
        host: 'kbopub.economie.fgov.be',
        port: 443,
        path: '/kbopub/zoeknummerform.html?nummer=' + bce + '&actionLu=Recherche',
        method: 'GET',
        headers: {
            'Accept-Language': 'fr-FR,fr;q=1'
        }
    };
    var ht = https.request(options, function(resp) {
        var r = '';
        resp.on('data', function(chunk) {
            r += chunk;
        });
        resp.on('end', function() {
            var table = /(<table id="toon".*?<\/table>)/.exec(r);
            if(!table) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            var tab = table[0];
            var rows = /(<tr>.*?<\/tr>)/.exec(tab);
            var mn: string = req.user.company_info.name.toLowerCase();
            while(rows != null) {
                var name = /<td.*?<\/td>.*?(<td>.*?<\/td>)/.exec(rows[0])[0];
                var parts = name.trim().split(',');
                if(/Administrateur/.test(rows[0]) && mn.indexOf(parts[0].trim().toLowerCase()) > -1 && mn.indexOf(parts[1].trim().toLowerCase()) > -1) {
                    req.user.company_info.name = /nomination sociale:<\/td><td class="QL" colspan="3">(.*?)<br>/.exec(r)[0].trim();
                    pem.createCertificate({
                        serviceKey: fs.readFileSync('./whigi/whigi-key.pem'),
                        days: 36500,
                        clientKey: req.user.rsa_pub_key,
                        country: 'BE',
                        state: '',
                        locality: '',
                        organization: req.user.company_info.name,
                        organizationUnit: '',
                        commonName: '',
                        emailAddress: ''
                    }, function(e, keys) {
                        if(!e)
                            req.user.cert = keys.certificate;
                        req.user.persist().then(function() {
                            res.type('application/json').status(200).json({error: '', name: req.user.company_info.name});
                        }, function(e) {
                            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                        });
                    });
                    return;
                }

                tab = tab.replace(/(<tr>.*?<\/tr>)/g, '');
                rows = /(<tr>.*?<\/tr>)/.exec(tab);
            }
            res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        });
    }).on('error', function(err) {
        res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
    });
    ht.end();
}

/**
 * Forges the response to list all possessed data as json, or HTTP 500 code.
 * @function listData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function listData(req, res) {
    req.user.fill().then(function() {
        var ret = {
            data: req.user.data,
            shared_with_me: {}
        };
        if(!('whigi-system' in req.user.shared_with_me))
            ret.shared_with_me = req.user.shared_with_me;
        res.type('application/json').status(200).json(ret);
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to list some possessed data as json, or HTTP 500 code.
 * @function someData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function someData(req, res) {
    var got = req.body;
    if(!(got.needed.constructor === Array) || !(got.maybe_stale.constructor === Array)) {
        res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
        return;
    }
    req.user.fill(got.maybe_stale.concat(got.needed)).then(function() {
        var stale = got.maybe_stale.filter(function(el: string): boolean {
            return !(el in req.user.shared_with_me);
        });
        var sh = {};
        for(var i = 0; i < got.needed.length; i++) {
            if(got.needed[i] in req.user.shared_with_me)
                sh[got.needed[i]] = req.user.shared_with_me[got.needed[i]];
        }
        res.type('application/json').status(200).json({
            stale: stale,
            shared_with_me: sh
        });
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to record a new info. An info with the same name will be erased.
 * @function recData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Whether to answer in res.
 * @return {Promise} When completed.
 */
export function recData(req, res, respond?: boolean): Promise {
    var got = req.body;
    respond = respond !== false;
    return new Promise(function(resolve, reject) {
        if(checks.isWhigi(req.user._id)) {
            if(respond === true)
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                reject();
            return;
        }
        got.name = got.name.replace(/\./g, '_');
        if(got.name.length > 127) {
            if(respond === true)
                res.type('application/json').status(400).json({error: utils.i18n('client.badState', req)});
                reject();
            return;
        }
        req.user.fill().then(function() {
            if(!!got.decr_data && !!got.key && got.is_bound == false) {
                try {
                    var mk = utils.str2arr(utils.atob(got.key));
                    got.encr_data = utils.arr2str(Array.from(new aes.ModeOfOperation.ctr(mk, new aes.Counter(0))
                        .encrypt(aes.util.convertStringToBytes(got.decr_data))));
                } catch(e) {
                    if(respond === true)
                        res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                    reject();
                    return;
                }
            } else if(!!got.decr_data && !!got.key && got.is_bound) {
                try {
                    var mk = utils.str2arr(utils.atob(got.key)), newaes = utils.toBytes(utils.generateRandomString(64));
                    got.encr_aes = utils.arr2str(Array.from(new aes.ModeOfOperation.ctr(mk, new aes.Counter(0)).encrypt(newaes)));
                    got.encr_data = utils.arr2str(Array.from(new aes.ModeOfOperation.ctr(newaes, new aes.Counter(0)).encrypt(aes.util.convertStringToBytes(got.decr_data))));
                } catch(e) {
                    if(respond === true)
                        res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                    reject();
                    return;
                }
            }
            var newid = got.is_bound? utils.genID(['datafragment'], 'datafragment') : utils.genID(['datafragment']), shared_to = {};
            if(got.name in req.user.data) {
                shared_to = req.user.data[got.name].shared_to;
                newid = req.user.data[got.name].id;
                //Trigger the triggers, without updates for security
                var keys = Object.getOwnPropertyNames(shared_to);
                for(var i = 0; i < keys.length; i++) {
                    utils.lameTrigger(db, req.user, shared_to[keys[i]], false);
                }
            }
            req.user.data[got.name] = {
                id: newid,
                length: Buffer.byteLength(got.encr_data, 'utf8'),
                is_dated: got.is_dated,
                version: got.version,
                shared_to: shared_to
            };
            var frg: Datafragment = new Datafragment(newid, got.encr_data, got.version, got.encr_aes, db);
            frg.persist().then(function() {
                req.user.persist().then(function() {
                    if(respond === true)
                        res.type('application/json').status(201).json({puzzle: req.user.puzzle, error: '', _id: newid, decr_aes: newaes});
                    resolve(req.pass);
                }, function(e) {
                    if(respond === true)
                        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                    reject();
                });
            }, function(e) {
                if(respond === true)
                    res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                reject();
            });
        }, function(e) {
            if(respond === true)
                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
            reject();
        });
    });
}

/**
 * Forges the response to update a user. Can return HTTP 200, 400 or 500 code.
 * @function updateUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function updateUser(req, res) {
    var upt = req.body;
    //No need to check for length, we have but a hash here anyways...
    req.user.applyUpdate(upt);
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to change username.
 * @function changeUsername
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function changeUsername(req, res) {
    var got = req.body, index = 0, array: {vid: string}[] = [], array2: string[] = [], array3: string[] = [];
    var proposal = got.new_username.toLowerCase().replace(/[^a-z0-9\-\_]/g, '');

    function final() {
        if(index < array3.length) {
            var work = array3[index];
            index++;
            db.retrieveUser(work, true).then(function(u: User) {
                u.shared_with_me[proposal] = u.shared_with_me[req.user._id];
                delete u.shared_with_me[req.user._id];
                u.persist().then(function() {
                    final();
                }, function(e) {
                    final();
                });
            }, function(e) {
                final();
            });
        }
    }
    function after() {
        if(index < array2.length) {
            var work = array2[index];
            index++;
            db.retrieveVault(work).then(function(v: Vault) {
                if(!v) {
                    after();
                    return;
                }
                v.sharer_id = proposal;
                if(array3.indexOf(v.shared_to_id) == -1)
                    array3.push(v.shared_to_id);
                v.persist().then(function() {
                    after();
                }, function(e) {
                    after();
                });
            }, function(e) {
                after();
            });
        } else {
            index = 0;
            final();
        }
    }
    function end() {
        if(index < array.length) {
            var work = array[index];
            index++;
            db.retrieveVault(work.vid).then(function(v: Vault) {
                if(!v) {
                    end();
                    return;
                }
                v.shared_to_id = proposal;
                v.persist().then(function() {
                    db.retrieveUser(v.sharer_id, true).then(function(u: User) {
                        u.data[v.real_name] = u.data[v.real_name] || {shared_to: {}};
                        delete u.data[v.real_name].shared_to[req.user._id];
                        u.data[v.real_name].shared_to[proposal] = v._id;
                        u.persist().then(function() {
                            end();
                        }, function(e) {
                            end();
                        });
                    }, function(e) {
                        end();
                    });
                }, function(e) {
                    end();
                });
            }, function(e) {
                end();
            });
        } else {
            var prev = req.user._id;
            req.user._id = proposal;
            req.user.persist().then(function() {
                req.user._id = prev;
                req.user.unlink();
                //Respond
                res.type('application/json').status(200).json({error: ''});
                //Remove auth tokens.
                removeToken({
                    user: req.user
                }, {}, false);
                //Change OAuth tokens
                for(var i = 0; i < req.user.oauth.length; i++) {
                    db.retrieveOauth(req.user.oauth[i].id).then(function(o: Oauth) {
                        if(!!o) {
                            o.bearer_id = proposal;
                            o.persist();
                        }
                    });
                }
                //Complete ownerships
                index = 0;
                after();
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
        }
    }
    function complete() {
        req.user.fill().then(function() {
            //If we already have >50000 records, cannot change. But seriously, should not happen...
            if('whigi-system' in req.user.shared_with_me) {
                res.type('application/json').status(400).json({error: utils.i18n('client.badState', req)});
                return;
            }
            //Set ownership of received vaults
            var keys = Object.getOwnPropertyNames(req.user.shared_with_me);
            for(var i = 0; i < keys.length; i++) {
                var kk = Object.getOwnPropertyNames(req.user.shared_with_me[keys[i]]);
                for(var j = 0; j < kk.length; j++) {
                    array.push({
                        vid: req.user.shared_with_me[keys[i]][kk[j]]
                    });
                }
            }
            //Set ownerships of sent vaults
            keys = Object.getOwnPropertyNames(req.user.data);
            for(var i = 0; i < keys.length; i++) {
                var kk = Object.getOwnPropertyNames(req.user.data[keys[i]].shared_to);
                for(var j = 0; j < kk.length; j++) {
                    array2.push(req.user.data[keys[i]].shared_to[kk[j]]);
                }
            }
            end();
        }, function() {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    if(req.user._id.indexOf('wiuser') != 0) {
        res.type('application/json').status(400).json({error: utils.i18n('client.badState', req)});
        return;
    }
    utils.checkCaptcha(req.query.captcha, function(ok) {
        if(ok || utils.DEBUG || req.query.android === 'true') {
            db.retrieveUser(proposal).then(function(u) {
                if(u == undefined)
                    complete();
                else
                    res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
        } else {
            res.type('application/json').status(400).json({error: utils.i18n('client.captcha', req)});
        }
    });
}

/**
 * Forges the response to the registration of a user.
 * @function regUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function regUser(req, res) {
    var user = req.body, proposal = user.username.toLowerCase().replace(/[^a-z0-9\-]/g, '');
    var pre_master_key: string = utils.generateRandomString(64);
    var rd: Function = recData;
    var array: any[] = [], index = 0;

    function next(u: User) {
        if(index < array.length) {
            var work = array[index];
            index++;

            db.retrieveUser(work.shared_to_id).then(function(rem: User) {
                if(!!rem) {
                    var pub_key: string = rem.rsa_pub_key;
                    var naes: number[] = utils.toBytes(utils.generateRandomString(64));
                    data.regVault({
                        user: u,
                        body: {
                            shared_to_id: rem._id,
                            real_name: work.real_name,
                            data_name: work.shared_as,
                            trigger: work.shared_trigger,
                            expire_epoch: work.shared_epoch,
                            aes_crypted_shared_pub: utils.encryptRSA(naes, pub_key),
                            data_crypted_aes: utils.arr2str(Array.from(new aes.ModeOfOperation.ctr(naes, new aes.Counter(0))
                                .encrypt(aes.util.convertStringToBytes(work.data)))),
                            version: work.version
                        }
                    }, {}, false).then(function() {
                        next(u);
                    }, function(e) {
                        next(u);
                    });
                }
            }, function(e) {
                next(u);
            });
        }
    }
    function end(u: User) {
        u.persist().then(function() {
            res.type('application/json').status(201).json({error: '', _id: u._id, hidden_id: u.hidden_id});
            //Warnign mail
            if('warn' in req.body && /^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(req.body.warn)) {
                mailer.sendMail(utils.mailConfig(req.body.warn, !!req.body['warnMode']? req.body['warnMode'] : 'otherAccount', req, Object.assign({
                    uid: u._id,
                    pwd: req.body.password
                }, req.body.warnContext || {})), function(e, i) {});
            }
            //Adding data and vaults
            if('more' in req.body) {
                var done = 0;
                for(var i = 0; i < req.body.more.length; i++) {
                    var encr = utils.arr2str(Array.from(new aes.ModeOfOperation.ctr(utils.toBytes(pre_master_key), new aes.Counter(0))
                        .encrypt(aes.util.convertStringToBytes(req.body.more[i].data))));
                    rd({
                        user: u,
                        body: {
                            name: req.body.more[i].real_name,
                            is_dated: req.body.more[i].is_dated,
                            encr_data: encr,
                            version: req.body.more[i].version,
                            is_bound: false,
                            encr_aes: ''
                        },
                        pass: req.body.more[i]
                    }, {}, false).then(function(passed) {
                        for(var j = 0; j < passed.shared_to.length; j++) {
                            array.push({
                                shared_to_id: passed.shared_to[j],
                                real_name: passed.real_name,
                                shared_as: passed.shared_as,
                                shared_trigger: passed.shared_trigger,
                                shared_epoch: passed.shared_epoch,
                                data: passed.data,
                                version: passed.version
                            });
                        }
                        done++;
                        if(done == req.body.more.length)
                            next(u);
                    });
                }
            }
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
    function complete() {
        var u: User = new User(user, db);
        var key = rsa.nextKeyPair();

        u._id = proposal;
        u.salt = utils.generateRandomString(64);
        u.puzzle = utils.generateRandomString(16);
        u.password = hash.sha256(hash.sha256(user.password) + u.salt);
        u.data = {};
        u.shared_with_me = {};
        u.oauth = [];
        u.sha_master = hash.sha256(hash.sha256(utils.arr2str(utils.toBytes(pre_master_key))));

        var ypt = hash.sha256(user.password + u.salt);
        for(var i = 0; i < 666; i++)
            ypt = hash.sha256(ypt);
        u.encr_master_key = Array.from(new aes.ModeOfOperation.ctr(utils.toBytes(ypt), new aes.Counter(0))
            .encrypt(utils.toBytes(pre_master_key)));
        u.rsa_pub_key = key.exportKey('public');
        u.rsa_pri_key = [Array.from(new aes.ModeOfOperation.ctr(utils.toBytes(pre_master_key), new aes.Counter(0))
            .encrypt(aes.util.convertStringToBytes(key.exportKey('private'))))];
        u.is_company = !!user.company_info? 1 : 0;
        u.company_info = {};
        u.hidden_id = utils.generateRandomString(24);
        if(!!user.company_info && !!user.company_info.name)
            u.company_info.name = user.company_info.name;
        if(!!user.company_info && !!user.company_info.bce)
            u.company_info.bce = user.company_info.bce;
        if(!!user.company_info && !!user.company_info.rrn)
            u.company_info.rrn = user.company_info.rrn;
        if(!!user.company_info && !!user.company_info.address)
            u.company_info.address = user.company_info.address;
        if(!!user.company_info && !!user.company_info.picture)
            u.company_info.picture = user.company_info.picture;
        if(!!user.company_info && !!user.company_info.is_company)
            u.company_info.is_company = true;
        pem.createCertificate({
            serviceKey: fs.readFileSync('./whigi/whigi-key.pem'),
            days: 36500,
            clientKey: u.rsa_pub_key,
            country: 'BE',
            state: '',
            locality: '',
            organization: '',
            organizationUnit: '',
            commonName: '',
            emailAddress: ''
        }, function(e, keys) {
            if(!e)
                u.cert = keys.certificate;
            else
                u.cert = '';
            end(u);
        });
    }

    if(user.password.length >= 8 && !checks.isWhigi(user.username)) {
        utils.checkCaptcha(req.query.captcha, function(ok) {
            if(ok || utils.DEBUG || req.query.android === 'true' || proposal.indexOf('wiuser-') == 0) {
                db.retrieveUser(proposal).then(function(u) {
                    if(u == undefined)
                        complete();
                    else
                        res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                res.type('application/json').status(400).json({error: utils.i18n('client.captcha', req)});
            }
        });
    } else {
        res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
    }
}

/**
 * Creates a new token for the user to log in.
 * @function newToken
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function newToken(req, res) {
    var newid = utils.generateRandomString(64);
    var t: Token = new Token(newid, req.user._id, (new Date).getTime(), req.body.is_eternal, db);
    t.persist().then(function() {
        res.type('application/json').status(201).json({puzzle: req.user.puzzle, error: '', _id: newid});
    }, function(e) {
        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
    });
}

/**
 * Removes tokens for the bearer.
 * @function removeToken
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Whether to respond.
 */
export function removeToken(req, res, respond?: boolean) {
    var token = (!!req.query && req.query.token) || undefined;
    respond = respond !== false;
    if(!!token) {
        db.retrieveToken({_id: token}).then(function(t: Token) {
            if(!!t) {
                if(t.bearer_id != req.user._id) {
                    if(respond === true)
                        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                    return;
                }
                t.unlink().then(function() {
                    if(respond === true)
                        res.type('application/json').status(200).json({error: ''});
                }, function(e) {
                    if(respond === true)
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                if(respond === true)
                    res.type('application/json').status(200).json({error: ''});
            }
        }, function(e) {
            if(respond === true)
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    } else {
        db.retrieveToken({bearer_id: req.user._id}).then(function(t: Token) {
            if(!!t) {
                t.unlink().then(function() {
                    removeToken(req, res);
                }, function(e) {
                    if(respond === true)
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                if(respond === true)
                    res.type('application/json').status(200).json({error: ''});
            }
        }, function(e) {
            if(respond === true)
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
}

/**
 * Creates a auth token on behalf of Whigi restore.
 * @function restoreToken
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function restoreToken(req, res) {
    var got = req.body;
    if(got.key == require('../common/key.json').key) {
        var t: Token = new Token(got.token_id, got.bearer_id, (new Date).getTime(), false, db);
        t.persist().then(function() {
            res.type('application/json').status(201).json({error: '', _id: got.token_id});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Creates a OAuth token.
 * @function createOAuth
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function createOAuth(req, res) {
    var got = req.body;
    var newid = !!got.is_admin? utils.genID(['admin'], 'admin') : utils.genID(['admin']);
    if(!/\/$/.test(got.prefix))
        got.prefix += '/';
    var o: Oauth = new Oauth(newid, req.user._id, got.for_id.toLowerCase(), got.prefix, db);
    var points = require('../common/oauths.json').points;

    function end(ok: boolean) {
        if(ok) {
            o.persist().then(function() {
                req.user.oauth = req.user.oauth || [];
                req.user.oauth.push({id: newid, for_id: got.for_id.toLowerCase(), prefix: got.prefix});
                req.user.persist().then(function() {
                    res.type('application/json').status(201).json({error: '', _id: newid});
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
        } else {
            res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        }
    }

    if(!points[got.for_id.toLowerCase()]) {
        end(true);
    } else {
        var options = {
            host: points[got.for_id.toLowerCase()].validateHost,
            port: 443,
            path: points[got.for_id.toLowerCase()].validatePath + '?token=' + got.token,
            method: 'GET'
        };
        var ht = https.request(options, function(res) {
            var r = '';
            res.on('data', function(chunk) {
                r += chunk;
            });
            res.on('end', function() {
                var res = JSON.parse(r);
                if('success' in res && res.success) {
                    end(true);
                } else {
                    end(false);
                }
            });
        }).on('error', function(err) {
            end(false);
        });
        ht.end();
    }
}

/**
 * Removes a OAuth token.
 * @function removeOAuth
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function removeOAuth(req, res) {
    function complete(o: Oauth) {
        for(var i = 0; i < req.user.oauth.length; i++) {
            if(req.user.oauth[i].id == req.params.id) {
                req.user.oauth.splice(i, 1);
                break;
            }
        }
        req.user.persist().then(function() {
            if(!!o)
                o.unlink();
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
    db.retrieveOauth(req.params.id).then(function(o: Oauth) {
        if(!o) {
            complete(undefined);
            return;
        }
        if(o.bearer_id != req.user._id) {
            res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
            return;
        }
        complete(o);
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}
