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
 * @TODO Check if must check ownership before sending.
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
                    last_access: 0
                }, db);
                v.persist().then(function() {
                    req.user.data[got.data_name].shared_to[got.shared_to_id] = v._id;
                    req.user.persist().then(function() {
                        db.retrieveUser('id', v.shared_to_id, true).then(function(sharee: User) {
                            if(!sharee) {
                                res.type('application/json').status(201).json({puzzle: req.user.puzzle,  error: '', _id: v._id});
                                return;
                            }
                            sharee.shared_with_me[req.user._id] = sharee.shared_with_me[req.user._id] || {};
                            sharee.shared_with_me[req.user._id][v.data_name] = v._id;
                            sharee.persist().then(function() {
                                mailer.sendMail({
                                    from: 'Whigi <' + utils.MAIL_ADDR + '>',
                                    to: '<' + sharee.email + '>',
                                    subject: utils.i18n('mail.subject.newData', req),
                                    html: '<b>' + v.data_name + '</b>' + utils.i18n('mail.body.shared', req) + req.user.email + '.<br /> \
                                        <a href="' + utils.RUNNING_ADDR + '/vault/' + encodeURIComponent(req.user.email) + '/' + v.data_name + '">' + utils.i18n('mail.body.click', req) + '</a><br />' +
                                        utils.i18n('mail.signature', req)
                                }, function(e, i) {});
                                res.type('application/json').status(201).json({puzzle: req.user.puzzle,  error: '', _id: v._id});
                            }, function(e) {
                                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
                            });
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
        delete req.user.data[req.params.data_name].shared_to[req.params.shared_to_id];
        req.user.persist().then(function() {
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    req.user.fill().then(function() {
        if(!(req.params.data_name in req.user.data)) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        } else {
            if(req.params.shared_to_id in req.user.data[req.params.data_name].shared_to) {
                db.retrieveVault({_id: req.user.data[req.params.data_name].shared_to[req.params.shared_to_id]}).then(function(v: Vault) {
                    if(!v) {
                        res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                        return;
                    }
                    db.retrieveUser('id', v.shared_to_id, true).then(function(sharee: User) {
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
            } else {
                res.type('application/json').status(200).json({error: ''});
            }
        }
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
    db.retrieveVault({
        data_name: req.params.data_name,
        sharer_id: req.params.sharer_id,
        shared_to_id: req.user._id
    }).then(function(v: Vault) {
        if(!!v) {
            v.last_access = (new Date).getTime();
            v.persist();
            res.type('application/json').status(200).json(Object.assign({puzzle: req.user.puzzle}, v.sanitarize()));
        } else {
            res.type('application/json').status(404).json(Object.assign({puzzle: req.user.puzzle}, {error: utils.i18n('client.noData', req)}));
        }
    }, function(e) {
        res.type('application/json').status(500).json(Object.assign({puzzle: req.user.puzzle}, {error: utils.i18n('internal.db', req)}));
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
        if(!(req.params.data_name in req.user.data)) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        } else {
            if(req.params.shared_to_id in req.user.data[req.params.data_name].shared_to) {
                db.retrieveVault({_id: req.user.data[req.params.data_name].shared_to[req.params.shared_to_id]}).then(function(v: Vault) {
                    res.type('application/json').status(200).json({last_access: v.last_access});
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
            }
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}
