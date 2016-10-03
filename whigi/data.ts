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
import {User} from '../common/models/User';
import {Vault} from '../common/models/Vault';
import {Datasource} from '../common/Datasource';
import {IModel} from '../common/models/IModel';
var fupt = require('../common/cdnize/full-update_pb');
var mailer;
var db: Datasource;

/**
 * Set up.
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
    ids.forEach(function(id) {
        db.retrieveData(id).then(function(df) {
            if(!df) {
                if(!ans) {
                    ans = true;
                    res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                }
            } else {
                var ret = df.sanitarize();
                if((req.query.key !== undefined)) {
                    try {
                        ret.decr_data = aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(utils.str2arr(utils.atob(req.query.key)),
                            new aes.Counter(0)).decrypt(utils.str2arr(ret.encr_data)));
                        delete ret.encr_data;
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
 * Forges the response to trigger vaults.
 * @function triggerVaults
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function triggerVaults(req, res) {
    var name = decodeURIComponent(req.params.data_name);
    req.user.fill().then(function() {
        if(name in req.user.data) {
            var keys = Object.getOwnPropertyNames(req.user.data[name].shared_to);
            for(var i = 0; i < keys.length; i++) {
                db.retrieveVault(req.user.data[name].shared_to[keys[i]]).then(function(v: Vault) {
                    if(v.expire_epoch > 0 && (new Date).getTime() > v.expire_epoch) {
                        db.retrieveUser(v.shared_to_id, true).then(function(u: User) {
                            delete u.shared_with_me[v.sharer_id][v.data_name];
                            u.persist();
                        });
                        delete req.user.data[v.real_name].shared_to[v.shared_to_id];
                        req.user.persist();
                        v.unlink();
                    } else if(v.trigger.length > 1) {
                        var ht = https.request({
                            host: v.trigger.split('/')[0],
                            path: v.trigger.split('/', 2)[1],
                            port: 443,
                            method: 'GET'
                        }, function(res) {
                            var r = '';
                            res.on('data', function(chunk) {
                                r += chunk;
                            });
                            res.on('end', function() {});
                        }).on('error', function(err) {});
                        ht.end();
                    }
                });
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
    respond = respond !== false;
    var storable = (typeof got.storable !== undefined && got.storable === true);
    return new Promise(function(resolve, reject) {
        if(storable && /whigi/i.test(got.shared_to_id)) {
            if(respond === true)
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                reject();
            return;
        }
        req.user.fill().then(function() {
            if(!(got.real_name in req.user.data)) {
                if(respond === true)
                    res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
                reject();
            } else {
                if(got.shared_to_id in req.user.data[got.real_name].shared_to) {
                    if(respond === true)
                        res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: '', _id: req.user.data[got.real_name].shared_to[got.shared_to_id]});
                    reject();
                } else {
                    var v: Vault = new Vault({
                        _id: storable? 'storable' + utils.generateRandomString(120) : utils.generateRandomString(128),
                        shared_to_id: got.shared_to_id,
                        data_name: got.data_name,
                        aes_crypted_shared_pub: got.aes_crypted_shared_pub,
                        data_crypted_aes: got.data_crypted_aes,
                        sharer_id: req.user._id,
                        last_access: 0,
                        expire_epoch: got.expire_epoch,
                        trigger: got.trigger.replace(/^http:\/\//, '').replace(/^https:\/\//, ''),
                        is_dated: req.user.data[got.real_name].is_dated,
                        real_name: got.real_name,
                        version: got.version
                    }, db);
                    db.retrieveUser(v.shared_to_id, true).then(function(sharee: User) {
                        if(!sharee) {
                            if(respond === true)
                                res.type('application/json').status(404).json({puzzle: req.user.puzzle,  error: 'client.noUser'});
                            reject();
                            return;
                        }
                        if(sharee._id == req.user._id) {
                            //Make sure only object is printed to DB
                            sharee = req.user;
                        }
                        if(!!got.decr_data) {
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
                            req.user.data[got.real_name].shared_to[got.shared_to_id] = v._id;
                            req.user.persist().then(function() {
                                sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                                if(v.data_name in sharee.shared_with_me[req.user._id]) {
                                    db.retrieveVault(sharee.shared_with_me[req.user._id][v.data_name]).then(function(ret: Vault) {
                                        ret.unlink();
                                    });
                                }
                                sharee.shared_with_me[req.user._id][v.data_name] = v._id;
                                sharee.persist().then(function() {
                                    if(respond === true)
                                        res.type('application/json').status(201).json({puzzle: req.user.puzzle,  error: '', _id: v._id});
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
    });
}

/**
 * Forges the response to removing a vault.
 * @function removeVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function removeVault(req, res) {
    function complete(v: Vault, s: User) {
        v.unlink();
        if(!!req.user.data[v.real_name])
            delete req.user.data[v.real_name].shared_to[v.shared_to_id];
        req.user.persist().then(function() {
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    req.user.fill().then(function() {
        db.retrieveVault(req.params.vault_id).then(function(v: Vault) {
            if(!v) {
                res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                return;
            }
            if(v.sharer_id != req.user._id || /whigi/i.test(v.shared_to_id)) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            db.retrieveUser(v.shared_to_id, true).then(function(sharee: User) {
                if(!!sharee) {
                    //Fix for self grants
                    if(sharee._id == req.user._id)
                        req.user = sharee;
                    sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                    delete sharee.shared_with_me[req.user._id][v.data_name];
                    sharee.persist().then(function() {
                        complete(v, sharee);
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

    req.user.fill().then(function() {
        db.retrieveVault(req.params.vault_id).then(function(v: Vault) {
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
                    db.retrieveUser(v.sharer_id, true).then(function(u: User) {
                        //Fix for self grants
                        if(u._id == req.user._id)
                            req.user = u;
                        delete u.data[v.real_name].shared_to[v.shared_to_id];
                        u.persist();
                    });
                    delete req.user.shared_with_me[v.sharer_id][v.data_name];
                    req.user.persist();
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
                db.retrieveUser(v.shared_to_id, true).then(function(u: User) {
                    //Fix for self grants
                    if(u._id == req.user._id)
                        req.user = u;
                    delete u.shared_with_me[v.sharer_id][v.data_name];
                    u.persist();
                });
                delete req.user.data[v.real_name].shared_to[v.shared_to_id];
                req.user.persist();
                v.unlink();
                res.type('application/json').status(417).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
                return;
            }
            res.type('application/json').status(200).json({last_access: v.last_access, expire_epoch: v.expire_epoch, trigger: v.trigger});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
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
        res.type('application/json').status(200).json(data.sanitarize());
    }
    function nok() {
        res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
    }

    if(req.params.key == require('../common/key.json').key) {
        switch(req.params.collection) {
            case 'users':
                db.retrieveUser(req.params.id).then(ok, nok);
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

    function rem(name, ids) {
        db.getDatabase().collection(name).remove({_id: {$in: ids}});
    }

    if(got.key == require('../common/key.json').key) {
        var load = fupt.FullUpdate.deserializeBinary(got.payload);
        var coll = load.getMappingsList();
        for(var i = 0; i < coll.length; i++) {
            var name = coll[i].getName();
            var del = coll[i].getDeletedList();
            rem(name, del);
            del = coll[i].getIdsList();
            rem(name, del);
        }
        res.type('application/json').status(200).json({error: ''});
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}
