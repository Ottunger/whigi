/**
 * API dealing with data retrieval and possible modification.
 * @module datafragment
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
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
 * Removes a data by name and associated vaults.
 * @function removeData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function removeData(req, res) {
    var name = decodeURIComponent(req.params.data_name);
    req.user.fill().then(function() {
        if(name in req.user.data) {
            db.unlink('datas', req.user.data[name].id);
            for(var id in req.user.data[name].shared_to)
                db.unlink('vaults', id);
            delete req.user.data[name];
            req.user.persist().then(function() {
                res.type('application/json').status(200).json({error: ''});
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

/**
 * Forges the response to retrieve a new info.
 * @function getData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function getData(req, res) {
    db.retrieveData(req.params.id).then(function(df) {
        if(!df) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        } else {
            res.type('application/json').status(200).json(df.sanitarize());
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to creating a new vault.
 * @function regVault
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function regVault(req, res) {
    var got = req.body;
    req.user.fill().then(function() {
        if(!(got.data_name in req.user.data)) {
            res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
        } else {
            if(got.shared_to_id in req.user.data[got.data_name].shared_to) {
                res.type('application/json').status(200).json({puzzle: req.user.puzzle, error: '', _id: req.user.data[got.data_name].shared_to[got.shared_to_id]});
            } else {
                var v: Vault = new Vault({
                    _id: utils.generateRandomString(128),
                    shared_to_id: got.shared_to_id,
                    data_name: got.data_name,
                    aes_crypted_shared_pub: got.aes_crypted_shared_pub,
                    data_crypted_aes: got.data_crypted_aes,
                    sharer_id: req.user._id,
                    last_access: 0,
                    expire_epoch: got.expire_epoch
                }, db);
                db.retrieveUser(v.shared_to_id, true).then(function(sharee: User) {
                    if(!sharee || sharee._id == req.user.id) {
                        res.type('application/json').status(404).json({puzzle: req.user.puzzle,  error: 'client.noUser'});
                        return;
                    }
                    v.persist().then(function() {
                        req.user.data[got.data_name].shared_to[got.shared_to_id] = v._id;
                        req.user.persist().then(function() {
                            sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                            sharee.shared_with_me[req.user._id][v.data_name] = v._id;
                            sharee.persist().then(function() {
                                res.type('application/json').status(201).json({puzzle: req.user.puzzle,  error: '', _id: v._id});
                            }, function(e) {
                                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                            });
                        }, function(e) {
                            res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                        });
                    }, function(e) {
                        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                    });
                }, function(e) {
                    res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                });
            }
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
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
    function complete(v: Vault) {
        v.unlink();
        if(!!req.user.data[v.data_name])
            delete req.user.data[v.data_name].shared_to[v.shared_to_id];
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
            if(v.sharer_id != req.user._id) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            db.retrieveUser(v.shared_to_id, true).then(function(sharee: User) {
                if(!!sharee) {
                    sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                    delete sharee.shared_with_me[req.user._id][v.data_name];
                    sharee.persist().then(function() {
                        complete(v);
                    }, function(e) {
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    });
                } else {
                    complete(v);
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
    db.retrieveVault(req.params.vault_id).then(function(v: Vault) {
        if(!!v) {
            if(v.shared_to_id != req.user._id) {
                res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
                return;
            }
            if(v.expire_epoch > 0 && (new Date).getTime() > v.expire_epoch) {
                db.retrieveUser(v.sharer_id, true).then(function(u: User) {
                    delete u.data[v.data_name].shared_to[v.shared_to_id];
                    u.persist();
                });
                delete req.user.shared_with_me[v.sharer_id][v.data_name];
                req.user.persist();
                v.unlink();
                res.type('application/json').status(417).json({error: utils.i18n('client.noData', req)});
                return;
            }
            v.last_access = (new Date).getTime();
            v.persist();
            res.type('application/json').status(200).json(v.sanitarize());
        } else {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
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
                    delete u.shared_with_me[v.sharer_id][v.data_name];
                    u.persist();
                });
                delete req.user.data[v.data_name].shared_to[v.shared_to_id];
                req.user.persist();
                v.unlink();
                res.type('application/json').status(417).json({puzzle: req.user.puzzle, error: utils.i18n('client.noData', req)});
                return;
            }
            res.type('application/json').status(200).json({last_access: v.last_access, expire_epoch: v.expire_epoch});
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
        res.type('application/json').status(401).json({error: utils.i18n('client.auth', req)});
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
        res.type('application/json').status(401).json({error: utils.i18n('client.auth', req)});
    }
}
