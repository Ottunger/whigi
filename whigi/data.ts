/**
 * API dealing with data retrieval and possible modification.
 * @module datafragment
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var https = require('https');
var ndm = require('nodemailer');
var aes = require('aes-js');
var hash = require('js-sha256');
var utils = require('../utils/utils');
var checks = require('../utils/checks');
import {User} from '../common/models/User';
import {Datafragment} from '../common/models/Datafragment';
import {Vault} from '../common/models/Vault';
import {Datasource} from '../common/Datasource';
import {IModel} from '../common/models/IModel';
var fupt = require('../common/cdnize/full-update_pb');
var mailer, last = 0, topay: {[id: string]: string} = require('./payed.json');
var db: Datasource;

/**
 * Set up.
 * @function managerInit
 * @public
 * @param {Datasource} dbg Database.
 */
export function managerInit(dbg: Datasource) {
    mailer = ndm.createTransport({
        port: 587,
        host: 'mail.wissl.org',
        secure: false,
        auth: {
            user: 'info@wissl.org',
            pass: 'ZwpmeNPuCb'
        },
        disableFileAccess: true,
        tls: {rejectUnauthorized: false}
    });
    db = dbg;
}

/**
 * Forges the response to retrieve a new info.
 * @function getData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getData(req, res) {
    var ids: string[], done = 0, returns = [], ans = false;
    try {
        ids = JSON.parse(req.params.id);
    } catch(e) {
        ids = [req.params.id];
    }
    req.query.key = (req.body || {}).key || req.query.key;
    ids.forEach(function(id) {
        db.retrieveData(id).then(function(df: Datafragment) {
            if(!df) {
                if(!ans) {
                    ans = true;
                    res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                }
            } else {
                var ret = df.sanitarize();
                if(req.query.key !== undefined && df._id.indexOf('datafragment') != 0) {
                    try {
                        ret.decr_data = aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(utils.str2arr(utils.atob(req.query.key)),
                            new aes.Counter(0)).decrypt(utils.str2arr(ret.encr_data)));
                        delete ret.encr_data;
                    } catch(e) {}
                } else if(req.query.key !== undefined && df._id.indexOf('datafragment') == 0) {
                    try {
                        ret.decr_aes = new aes.ModeOfOperation.ctr(utils.str2arr(utils.atob(req.query.key)),
                            new aes.Counter(0)).decrypt(utils.str2arr(ret.encr_aes));
                        ret.decr_data = aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(ret.decr_aes,
                            new aes.Counter(0)).decrypt(utils.str2arr(ret.encr_data)));
                        ret.decr_aes = Array.from(ret.decr_aes);
                        delete ret.encr_data;
                        delete ret.encr_aes;
                    } catch(e) {}
                }
                returns.push(ret);
                done++;
                if(done == ids.length && !ans) {
                    if(done == 1)
                        res.type('application/json').status(200).json(ret);
                    else
                        res.type('application/json').status(200).json(returns);
                }
            }
        }, function(e) {
            if(!ans) {
                ans = true;
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            }
        });
    });
}

/**
 * Forges the response to retrieve a new info.
 * @function getDataByName
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getDataByName(req, res) {
    var name = decodeURIComponent(req.params.name);
    req.user.fill().then(function() {
        if(name in req.user.data) {
            db.retrieveData(req.user.data[name].id).then(function(df: Datafragment) {
                if(!df) {
                    res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                } else {
                    res.type('application/json').status(200).json(df.sanitarize());
                }
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
        } else {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to renaming a data.
 * @function renameData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Should respond.
 * @return {Promise} When complete.
 */
export function renameData(req, res, respond): Promise {
    var old = decodeURIComponent(req.params.name), now = decodeURIComponent(req.params.now);
    respond = respond !== false;
    return new Promise(function(resolve, reject) {
        if(checks.isWhigi(req.user._id) && req.whigiforce !== true) {
            if(respond === true)
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
            reject();
            return;
        }
        req.user.fill().then(function() {
            if(!(old in req.user.data)) {
                if(respond === true)
                    res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
                reject();
                return;
            }
            if(now in req.user.data) {
                if(respond === true)
                    res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                reject();
                return;
            }
            req.user.data[now] = req.user.data[old];
            delete req.user.data[old];
            req.user.persist().then(function() {
                if(respond === true)
                    res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: ''});
                resolve();
                //Now transfer to vaults
                var keys = Object.getOwnPropertyNames(req.user.data[now].shared_to);
                keys.forEach(function(key) {
                    db.retrieveVault(req.user.data[now].shared_to[key]).then(function(v: Vault) {
                        if(!!v) {
                            v.real_name = now;
                            v.persist();
                        }
                    });
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
 * Forges the response to trigger vaults.
 * @function triggerVaults
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function triggerVaults(req, res) {
    var name = decodeURIComponent(req.params.data_name);
    if(last >= (new Date).getTime() - 1000) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.fast', req)});
        return;
    }
    last = (new Date).getTime();
    req.user.fill().then(function() {
        if(name in req.user.data) {
            var keys = Object.getOwnPropertyNames(req.user.data[name].shared_to);
            for(var i = 0; i < keys.length; i++) {
                utils.lameTrigger(db, req.user, req.user.data[name].shared_to[keys[i]], true);
            }
            res.type('application/json').status(200).json({error: ''});
        } else {
            res.type('application/json').status(200).json({error: ''});
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Removes a data by name and associated vaults.
 * @function removeData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Should respond.
 */
export function removeData(req, res, respond?: boolean) {
    var name = decodeURIComponent(req.params.data_name);
    respond = respond !== false;
    if(checks.isWhigi(req.user._id)) {
        if(respond === true)
            res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
        return;
    }
    req.user.fill().then(function() {
        if(name in req.user.data) {
            if(respond === true && Object.getOwnPropertyNames(req.user.data[name].shared_to).length != 0) {
                if(respond === true)
                    res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            db.unlink('datas', req.user.data[name].id);
            delete req.user.data[name];
            req.user.persist().then(function() {
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
}

/**
 * Forges the response to adding a simlink for a vault.
 * @function linkVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @return {Promise} When complete.
 */
export function linkVault(req, res) {
    var got = req.body;
    db.retrieveVault(got.vault_id).then(function(v: Vault) {
        if(v.sharer_id != req.user._id) {
            res.type('application/json').status(403).json({puzzle: req.user.puzzle, error: utils.i18n('client.auth', req)});
            return;
        }
        if(v.links.length < 9 && v.links.indexOf(got.data_name) == -1) {
            v.links.push(got.data_name);
            db.retrieveUser(v.shared_to_id, true, [req.user._id]).then(function(sharee) {
                if(got.data_name in sharee.shared_with_me[req.user._id] && sharee.shared_with_me[req.user._id][got.data_name] != v._id) {
                    res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                } else if(got.data_name in sharee.shared_with_me[req.user._id]) {
                    res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: ''});
                } else {
                    v.persist().then(function() {
                        sharee.shared_with_me[req.user._id][got.data_name] = v._id;
                        sharee.persist().then(function() {
                            res.type('application/json').status(201).json({puzzle: req.user.puzzle, error: ''});
                        }, function(e) {
                            res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                        });
                    }, function(e) {
                        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                    });
                }
            }, function(e) {

            });
        } else if(v.links.length < 9) {
            res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: ''});
        } else {
            res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to creating a new vault.
 * @function regVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Should respond.
 * @return {Promise} When complete.
 */
export function regVault(req, res, respond?: boolean): Promise {
    var got = req.body;
    got.links = got.links || [];
    respond = respond !== false;
    var storable = got.storable === true;
    req.query.key = (req.body || {}).key || req.query.key;
    return new Promise(function(resolve, reject) {
        //The handler
        function complete() {
            got.data_name = got.data_name.replace(/\./g, '_');
            got.real_name = got.real_name.replace(/\./g, '_'); //Should already be done...
            if(got.data_name.length > 127) {
                if(respond === true)
                    res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                    reject();
                return;
            }
            req.user.fill().then(function() {
                if(!(got.real_name in req.user.data)) {
                    if(respond === true)
                        res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
                    reject();
                } else {
                    if(got.shared_to_id.toLowerCase() in req.user.data[got.real_name].shared_to) {
                        if(respond === true)
                            res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: '', _id: req.user.data[got.real_name].shared_to[got.shared_to_id.toLowerCase()], new: false});
                        reject();
                    } else {
                        //Cannot create a storable vault if we are trying to create a bound vault
                        if(storable && got.data_crypted_aes.indexOf('datafragment') == 0) {
                            if(respond === true)
                                res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                            reject();
                            return;
                        }
                        var keys = Object.getOwnPropertyNames(req.user.data[got.real_name].shared_to);
                        //Cannot create a storable vault if vaults exist
                        if(storable && keys.length != 0) {
                            if(respond === true)
                                res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                            reject();
                            return;
                        }
                        //Cannot create a vault if a storable one exists
                        if(keys.length == 1 && req.user.data[got.real_name].shared_to[keys[0]].indexOf('storable') == 0) {
                            if(respond === true)
                                res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                            reject();
                            return;
                        }
                        var v: Vault = new Vault({
                            _id: storable? utils.genID(['storable'], 'storable') : utils.genID(['storable']),
                            shared_to_id: got.shared_to_id.toLowerCase(),
                            data_name: got.data_name,
                            aes_crypted_shared_pub: got.aes_crypted_shared_pub,
                            data_crypted_aes: got.data_crypted_aes,
                            sharer_id: req.user._id,
                            last_access: 0,
                            expire_epoch: got.expire_epoch,
                            trigger: got.trigger.replace(/^https?:\/\//, ''),
                            is_dated: req.user.data[got.real_name].is_dated,
                            real_name: got.real_name,
                            version: got.version
                        }, db);
                        db.retrieveUser(v.shared_to_id, true, [req.user._id]).then(function(sharee: User) {
                            if(!sharee) {
                                if(respond === true)
                                    res.type('application/json').status(404).json({puzzle: req.user.puzzle,  error: 'client.noUser'});
                                reject();
                                return;
                            }
                            v.trigger = v.trigger.replace(/:whigi_id:/g, sharee._id).replace(/:whigi_hidden_id:/g, sharee.hidden_id);
                            if(sharee._id == req.user._id) {
                                //Make sure only object is printed to DB
                                sharee = req.user;
                            }
                            if(!!req.body.mail) {
                                //Send mail, maybe?
                                utils.mailUser(sharee._id, db, function(mail: string) {
                                    mailer.sendMail(utils.mailConfig(mail, req.body.template || 'newVault', req, Object.assign({
                                        requester: req.user._id,
                                        given_url: req.body.mail,
                                        share: v._id
                                    }, req.body.templateContext || {}), sharee), function(e, i) {});
                                });
                            }
                            if(v.data_crypted_aes.indexOf('datafragment') == 0 && !!req.query.key) {
                                //Bound vault from mobile
                                try {
                                    var naes: number[] = req.whigiforce? req.query.key : utils.str2arr(utils.atob(req.query.key))
                                    v.aes_crypted_shared_pub = utils.encryptRSA(naes, sharee.rsa_pub_key);
                                } catch(e) {
                                    if(respond === true)
                                        res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                                    reject();
                                    return;
                                }
                            } else if(!!got.decr_data) {
                                //Unbound vault from mobile
                                try {
                                    var naes: number[] = utils.toBytes(utils.generateRandomString(64));
                                    v.aes_crypted_shared_pub = utils.encryptRSA(naes, sharee.rsa_pub_key);
                                    v.data_crypted_aes = utils.arr2str(Array.from(new aes.ModeOfOperation.ctr(naes, new aes.Counter(0))
                                        .encrypt(aes.util.convertStringToBytes(got.decr_data))));
                                } catch(e) {
                                    if(respond === true)
                                        res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.badState', req)});
                                    reject();
                                    return;
                                }
                            }
                            if(storable) {
                                v.storable = [(!!got.store_path)? got.store_path : got.data_name];
                            }
                            v.persist().then(function() {
                                req.user.data[got.real_name].shared_to[v.shared_to_id] = v._id;
                                req.user.persist().then(function() {
                                    sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                                    //We were already granted something to that name
                                    if(v.data_name in sharee.shared_with_me[req.user._id]) {
                                        db.retrieveVault(sharee.shared_with_me[req.user._id][v.data_name]).then(function(ret: Vault) {
                                            if(!!req.user.data[ret.real_name] && !!req.user.data[ret.real_name].shared_to)
                                                delete req.user.data[ret.real_name].shared_to[sharee._id];
                                            for(var i = 0; i < ret.links.length; i++)
                                                delete sharee.shared_with_me[req.user._id][ret.links[i]];
                                            req.user.persist();
                                            ret.unlink();
                                        });
                                    }
                                    sharee.shared_with_me[req.user._id][v.data_name] = v._id;
                                    for(var i = 0; i < 10 && i < got.links.length; i++) {
                                        if(!(got.links[i] in sharee.shared_with_me)) {
                                            sharee.shared_with_me[req.user._id][got.links[i]] = v._id;
                                            v.links.push(got.links[i]);
                                        }
                                    }
                                    if(v.links.length > 0)
                                        v.persist();
                                    sharee.persist().then(function() {
                                        if(respond === true)
                                            res.type('application/json').status(201).json({puzzle: req.user.puzzle,  error: '', _id: v._id, new: true});
                                        resolve();
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
                        }, function(e) {
                            if(respond === true)
                                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                            reject();
                        });
                    }
                }
            }, function(e) {
                if(respond === true)
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                reject();
            });
        }
        //A bit of sanity check before doing
        if(got.shared_to_id.toLowerCase() == 'whigi-dev-null') {
            //Empty bin
            if(respond === true)
                res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: '', _id: null});
                resolve();
            return;
        }
        if(checks.isWhigi(req.user._id) && req.whigiforce !== true) {
            //Cannot create a vault as whigi account
            if(respond === true)
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                reject();
            return;
        }
        if(storable && checks.isWhigi(got.shared_to_id)) {
            //Cannot share storable vault towards whigi accounts
            if(respond === true)
                res.type('application/json').status(403).json({puzzle: req.user.puzzle, error: utils.i18n('client.auth', req)});
                reject();
            return;
        }
        if(!!topay[got.shared_to_id]) {
            db.retrieveUser('whigi-wissl', true).then(function(whigi) {
                if(!(('payments/' + topay[got.shared_to_id] + '/' + req.user._id) in whigi.data)) {
                    if(respond === true)
                        res.type('application/json').status(400).json({puzzle: req.user.puzzle, error: utils.i18n('client.paying', req)});
                        reject();
                    return;
                }
                //Remove the share
                removeVault({
                    user: whigi,
                    params: {vault_id: whigi.data['payments/' + topay[got.shared_to_id] + '/' + req.user._id].shared_to[req.user._id]}
                }, {}, false).then(function() {
                    whigi.data['payments/' + topay[got.shared_to_id] + '/' + req.user._id].shared_to = {};
                    db.retrieveUser(req.user._id, true).then(function(now) {
                        req.user = now;
                        //Archive the payment
                        renameData({
                            user: whigi,
                            params: {
                                name: encodeURIComponent('payments/' + topay[got.shared_to_id] + '/' + req.user._id),
                                now: encodeURIComponent('payments_used/' + topay[got.shared_to_id] + '/' + req.user._id),
                            },
                            whigiforce: true
                        }, {}, false).then(function() {
                            complete();
                        }, function(e) {
                            if(respond === true)
                                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                            reject();
                        });
                    }, function(e) {
                        if(respond === true)
                            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                        reject();
                    });
                }, function(e) {
                    if(respond === true)
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    reject();
                });
            }, function(e) {
                if(respond === true)
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                reject();
            });
        } else {
            complete();
        }
    });
}

/**
 * Forges the response to removing a vault.
 * @function removeVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Should respond.
 * @return {Promise} When complete.
 */
export function removeVault(req, res, respond): Promise {
    respond = respond !== false;
    return new Promise(function(resolve, reject) {
        function complete(v: Vault, s: User) {
            v.unlink();
            if(!!req.user.data[v.real_name])
                delete req.user.data[v.real_name].shared_to[v.shared_to_id];
            req.user.persist().then(function() {
                if(respond === true)
                    res.type('application/json').status(200).json({error: ''});
                resolve();
            }, function(e) {
                if(respond === true)
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                reject();
            });
        }
        //Now loading...
        req.user.fill().then(function() {
            db.retrieveVault(req.params.vault_id).then(function(v: Vault) {
                if(!v) {
                    if(respond === true)
                        res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                    reject();
                    return;
                }
                if(v.sharer_id != req.user._id || checks.isWhigi(v.shared_to_id)) {
                    if(respond === true)
                        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                    reject();
                    return;
                }
                db.retrieveUser(v.shared_to_id, true, [req.user._id]).then(function(sharee: User) {
                    if(!!sharee) {
                        //Fix for self grants
                        if(sharee._id == req.user._id)
                            req.user = sharee;
                        sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                        delete sharee.shared_with_me[req.user._id][v.data_name];
                        for(var i = 0; i < v.links.length; i++)
                            delete sharee.shared_with_me[req.user._id][v.links[i]];
                        sharee.persist().then(function() {
                            complete(v, sharee);
                        }, function(e) {
                            if(respond === true)
                                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                            reject();
                        });
                    } else {
                        complete(v, undefined);
                    }
                }, function(e) {
                    if(respond === true)
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    reject();
                });
            }, function(e) {
                if(respond === true)
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                reject();
            });
        }, function(e) {
            if(respond === true)
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            reject();
        });
    });
}

/**
 * Forges the response to removing a vault.
 * @function removeStorable
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function removeStorable(req, res) {
    function complete(v: Vault, s: User) {
        v.unlink();
        if(!!s.data[v.real_name])
            delete s.data[v.real_name].shared_to[v.shared_to_id];
        s.persist().then(function() {
            //For storable vaults, remove incoming data as well
            removeData({user: s, params: {
                data_name: encodeURIComponent(v.real_name)
            }}, {}, false);
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    db.retrieveVault(req.params.vault_id).then(function(v: Vault) {
        req.user.fill([v.sharer_id]).then(function() {
            if(!v) {
                res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                return;
            }
            if(v.shared_to_id != req.user._id || !v.storable || v._id.indexOf('storable') != 0) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            db.retrieveUser(v.sharer_id, true).then(function(sharer: User) {
                if(!!sharer) {
                    //Fix for self grants
                    if(sharer._id == req.user._id)
                        req.user = sharer;
                    req.user.shared_with_me[sharer._id] = req.user.shared_with_me[sharer._id] || {};
                    delete req.user.shared_with_me[sharer._id][v.data_name];
                    for(var i = 0; i < v.links.length; i++)
                        delete req.user.shared_with_me[sharer._id][v.links[i]];
                    req.user.persist().then(function() {
                        complete(v, sharer);
                    }, function(e) {
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    });
                } else {
                    complete(v, undefined);
                }
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to retrieving a vault.
 * @function getVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getVault(req, res) {
    var ids: string[], done = 0, returns = [], ans = false;
    try {
        ids = JSON.parse(req.params.vault_id);
    } catch(e) {
        ids = [req.params.vault_id];
    }
    req.query.key = (req.body || {}).key || req.query.key;

    function process(ret) {
        if((req.query.key !== undefined)) {
            try {
                req.query.key = utils.atob(req.query.key);
                var key: number[] = utils.decryptRSA(ret.aes_crypted_shared_pub, req.query.key);
                ret.decr_data = aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(key, new aes.Counter(0)).decrypt(utils.str2arr(ret.data_crypted_aes)));
                delete ret.aes_crypted_shared_pub;
                delete ret.data_crypted_aes;
            } catch(e) {}
        }
        returns.push(ret);
        done++;
        if(done == ids.length && !ans) {
            if(done == 1)
                res.type('application/json').status(200).json(ret);
            else
                res.type('application/json').status(200).json(returns);
        }
    }
    ids.forEach(function(id) {
        db.retrieveVault(id).then(function(v: Vault) {
            if(!!v) {
                if(v.shared_to_id != req.user._id) {
                    if(!ans) {
                        ans = true;
                        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                    }
                    return;
                }
                if(v.expire_epoch > 0 && (new Date).getTime() > v.expire_epoch) {
                    db.retrieveUser(v.sharer_id, true, [v.sharer_id]).then(function(u: User) {
                        //Fix for self grants
                        if(u._id == req.user._id) {
                            req.user = u;
                            delete req.user.shared_with_me[v.sharer_id][v.data_name];
                            for(var i = 0; i < v.links.length; i++)
                                delete req.user.shared_with_me[v.sharer_id][v.links[i]];
                        }
                        delete u.data[v.real_name].shared_to[v.shared_to_id];
                        u.persist();
                    });
                    if(v.sharer_id != req.user._id) {
                        req.user.fill([v.sharer_id]).then(function() {
                            delete req.user.shared_with_me[v.sharer_id][v.data_name];
                            for(var i = 0; i < v.links.length; i++)
                                delete req.user.shared_with_me[v.sharer._id][v.links[i]];
                            req.user.persist();
                        });
                    }
                    v.unlink();
                    if(!ans) {
                        ans = true;
                        res.type('application/json').status(417).json({error: utils.i18n('client.noData', req)});
                    }
                    return;
                }
                v.last_access = (new Date).getTime();
                v.persist();
                var ret = v.sanitarize();
                //For bound vaults, now is the time to get the encrypted data
                if(ret.data_crypted_aes.indexOf('datafragment') == 0) {
                    db.retrieveData(ret.data_crypted_aes).then(function(d: Datafragment) {
                        if(!d && !ans) {
                            ans = true;
                            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                            return;
                        }
                        ret.data_crypted_aes = d.encr_data;
                        process(ret);
                    }, function(e) {
                        if(!ans) {
                            ans = true;
                            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                        }
                    });
                } else {
                    process(ret);
                }
            } else {
                if(!ans) {
                    ans = true;
                    res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                }
            }
        }, function(e) {
            if(!ans) {
                ans = true;
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            }
        });
    });
}

/**
 * Forges the response to the last time a vault was accessed.
 * @function accessVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function accessVault(req, res) {
    req.user.fill().then(function() {
        db.retrieveVault(req.params.vault_id).then(function(v: Vault) {
            if(!v) {
                res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                return;
            }
            if(v.sharer_id != req.user._id) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            if(v.expire_epoch > 0 && (new Date).getTime() > v.expire_epoch) {
                db.retrieveUser(v.shared_to_id, true, [v.sharer_id]).then(function(u: User) {
                    //Fix for self grants
                    if(u._id == req.user._id)
                        req.user = u;
                    delete u.shared_with_me[v.sharer_id][v.data_name];
                    for(var i = 0; i < v.links.length; i++)
                        delete u.shared_with_me[v.sharer_id][v.links[i]];
                    u.persist();
                });
                delete req.user.data[v.real_name].shared_to[v.shared_to_id];
                req.user.persist();
                v.unlink();
                res.type('application/json').status(417).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
                return;
            }
            res.type('application/json').status(200).json({last_access: v.last_access, expire_epoch: v.expire_epoch, trigger: v.trigger, shared_as: v.data_name, links: v.links});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to list receivers for public shares.
 * @function whoTo
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function whoTo(req, res) {
    db.retrieveUser(req.params.id, true).then(function(u: User) {
        if(!u) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
            return;
        }
        var data = decodeURIComponent(req.params.name);
        switch(data) {
            case 'keys/pwd/mine1':
            case 'keys/pwd/mine2':
                break;
            default:
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
        }
        if(!u.data[data]) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
            return;
        }
        res.type('application/json').status(200).json({to: Object.getOwnPropertyNames(u.data[data].shared_to)});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Gets any data on behalf of Whigi.
 * @function getAny
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getAny(req, res) {
    function ok(data: IModel) {
        res.type('application/json').status(200).json(data.allFields());
    }
    function nok() {
        res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
    }

    if(req.user._id != 'whigi-wissl') {
        switch(req.params.collection) {
            case 'users':
                db.retrieveUser(req.params.id, true).then(ok, nok);
                break;
            case 'datas':
                db.retrieveData(req.params.id).then(ok, nok);
                break;
            case 'tokens':
                db.retrieveToken({_id: req.params.id}).then(ok, nok);
                break;
            case 'vaults':
                db.retrieveVault(req.params.id).then(ok, nok);
                break;
            default:
                nok();
                break;
        }
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Deletes a data on behalf of Whigi RLI.
 * @function removeAny
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function removeAny(req, res) {
    var got = req.body;
    function rem(name: string, ids: string[]) {
        db.getDatabase().collection(name).remove({_id: {$in: ids}});
    }

    if(req.user._id != 'whigi-wissl') {
        if(!!got.payload) {
            var load = fupt.FullUpdate.deserializeBinary(got.payload);
            var coll = load.getMappingsList();
            for(var i = 0; i < coll.length; i++) {
                var name = coll[i].getName();
                var del = coll[i].getDeletedList();
                rem(name, del);
                del = coll[i].getIdsList();
                rem(name, del);
            }
        } else if (!!got.collection && !!got.id) {
            rem(got.collection, [got.id]);
        }
        res.type('application/json').status(200).json({error: ''});
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Asks for a grant by mail.
 * @function askGrants
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function askGrants(req, res) {
    function complete(u: User, mail: string, given_url: string) {
        mailer.sendMail(utils.mailConfig(mail, req.body.template || 'askGrant', req, Object.assign({
            requester: req.user._id,
            given_url: given_url
        }, req.body.templateContext || {}), u), function(e, i) {});
    }

    var gurl: string = utils.RUNNING_ADDR + '/account/' + req.user._id;
    if(!!req.body.why)
        gurl += encodeURIComponent(':' + req.body.why);
    gurl += '/' + encodeURIComponent(utils.RUNNING_ADDR) + '%2Fprofile/' + encodeURIComponent(utils.RUNNING_ADDR) + '%2Fprofile/false/';
    if(req.body.list.constructor !== Array) {
        res.type('application/json').status(400).json({error: utils.i18n('client.badState', req)});
        return;
    }
    gurl += req.body.list.map(String).map(encodeURIComponent).join('::');
    gurl += '/' + req.body.expire + '/' + encodeURIComponent(req.body.trigger);
    if(/^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(req.body.towards)) {
        res.type('application/json').status(200).json({error: ''});
        complete(req.body.lang, req.body.towards, gurl);
    } else {
        utils.mailUser(req.body.towards, db, function(email, person) {
            res.type('application/json').status(200).json({error: ''});
            complete(person, email, gurl);
        }, function() {
            res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
        });
    }
}
