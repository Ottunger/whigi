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
var hash = require('js-sha256');
var aes = require('aes-js');
var RSA = require('node-rsa');
import {User} from '../common/models/User';
import {Datafragment} from '../common/models/Datafragment';
import {Token} from '../common/models/Token';
import {Oauth} from '../common/models/Oauth';
import {Datasource} from '../common/Datasource';
var mailer;
var db: Datasource;

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
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
}

/**
 * Forges the response to some user info as json, or HTTP 500 code.
 * @function getUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getUser(req, res) {
    var dec = decodeURIComponent(req.params.id);
    db.retrieveUser(dec).then(function(user) {
        if(!!user) {
            res.type('application/json').status(200).json(Object.assign({puzzle: req.user.puzzle}, user.sanitarize()));
        } else {
            res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noUser', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
    });

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
 * Go Company.
 * @function goCompany
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function goCompany(req, res) {
    req.user.is_company = 1;
    req.user.company_info = req.body;
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
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
        res.type('application/json').status(200).json({
            data: req.user.data,
            shared_with_me: req.user.shared_with_me
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
 */
export function recData(req, res, respond?: boolean) {
    var got = req.body;
    respond = respond || true;
    req.user.fill().then(function() {
        var newid = utils.generateRandomString(128);
        req.user.data[got.name] = {
            id: newid,
            length: Buffer.byteLength(got.encr_data, 'utf8'),
            shared_to: {}
        }
        var frg: Datafragment = new Datafragment(newid, got.encr_data, db);
        frg.persist().then(function() {
            req.user.persist().then(function() {
                if(!!respond)
                    res.type('application/json').status(201).json({puzzle: req.user.puzzle, error: '', _id: newid});
            }, function(e) {
                if(!!respond)
                    res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
            });
        }, function(e) {
            if(!!respond)
                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
        });
    }, function(e) {
        if(!!respond)
            res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
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
    if(upt.new_password.length < 8) {
        res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
        return;
    }
    req.user.applyUpdate(upt);
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
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
    var user = req.body;
    function end(u: User) {
        u.persist().then(function() {
            res.type('application/json').status(201).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
    function complete() {
        var u: User = new User(user, db);
        var pre_master_key: string = utils.generateRandomString(64);
        var key = new RSA();
        key.generateKeyPair(4096, 65537);

        u._id = user.username;
        u.salt = utils.generateRandomString(64);
        u.puzzle = utils.generateRandomString(16);
        u.password = hash.sha256(hash.sha256(user.password) + u.salt);
        u.data = {};
        u.shared_with_me = {};
        u.oauth = [];
        u.encr_master_key = Array.from(new aes.ModeOfOperation.ctr(utils.toBytes(hash.sha256(user.password + u.salt)), new aes.Counter(0))
            .encrypt(utils.toBytes(pre_master_key)));
        u.rsa_pub_key = key.exportKey('public');
        u.rsa_pri_key = Array.from(new aes.ModeOfOperation.ctr(utils.toBytes(hash.sha256(user.password + u.salt)), new aes.Counter(0))
            .encrypt(aes.util.convertStringToBytes(key.exportKey('private'))));
        u.is_company = !!user.company_info? 1 : 0;
        u.company_info = !!user.company_info? user.company_info : {};
        end(u);
    }

    if(user.password.length >= 8) {
        utils.checkCaptcha(req.query.captcha, function(ok) {
            if(ok) {
                db.retrieveUser(user.username).then(function(u) {
                    if(u == undefined)
                        complete();
                    else
                        res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
                }, function(e) {
                    complete();
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
 */
export function removeToken(req, res) {
    var token = (!!req.query && req.query.token) || undefined;
    if(!!token) {
        db.retrieveToken({_id: token}).then(function(t: Token) {
            if(!!t) {
                if(t.bearer_id != req.user._id) {
                    res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                    return;
                }
                t.unlink().then(function() {
                    removeToken(req, res);
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                res.type('application/json').status(200).json({error: ''});
            }
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    } else {
        db.retrieveToken({bearer_id: req.user._id}).then(function(t: Token) {
            if(!!t) {
                t.unlink().then(function() {
                    removeToken(req, res);
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                res.type('application/json').status(200).json({error: ''});
            }
        }, function(e) {
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
        res.type('application/json').status(401).json({error: utils.i18n('client.auth', req)});
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
    var newid = utils.generateRandomString(64);
    var o: Oauth = new Oauth(newid, req.user._id, got.for_id, got.prefix, db);
    var points = require('../common/oauths.json').points;

    function end(ok: boolean) {
        if(ok) {
            o.persist().then(function() {
                req.user.oauth = req.user.oauth || [];
                req.user.oauth.push({id: newid, for_id: got.for_id, prefix: got.prefix});
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

    if(!points[got.for_id]) {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    } else {
        var options = {
            host: points[got.for_id].validateHost,
            port: 443,
            path: points[got.for_id].validatePath + '?token=' + got.token,
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
    db.retrieveOauth(req.params.id).then(function(o: Oauth) {
        if(!o) {
            res.type('application/json').status(200).json({error: ''});
            return;
        }
        if(o.bearer_id != req.user._id) {
            res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
            return;
        }
        for(var i = 0; i < req.user.oauth.length; i++) {
            if(req.user.oauth[i].id == req.params.id) {
                delete req.user.oauth[i];
                break;
            }
        }
        req.user.persist().then(function() {
            o.unlink();
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}
