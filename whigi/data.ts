/**
 * API dealing with data retrieval and possible modification.
 * @module datafragment
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var utils = require('../utils/utils');
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
        if(df === undefined ||df === null) {
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
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        } else {
            if(got.shared_to_id in req.user.data[got.data_name].shared_to) {
                res.type('application/json').status(200).json({error: ''});
            } else {
                var v: Vault = new Vault({
                    _id: utils.generateRandomString(64),
                    shared_to_id: got.shared_to_id,
                    data_name: got.data_name,
                    aes_crypted_shared_pub: got.aes_crypted_shared_pub,
                    data_crypted_aes: got.data_crypted_aes,
                    sharer_id: req.useer._id,
                    last_access: 0
                }, db);
                v.persist().then(function() {
                    req.user.data[got.data_name].shared_to[got.shared_to_id] = v._id;
                    req.user.persist().then(function() {
                        db.retrieveUser('id', v.shared_to_id).then(function(sharee) {
                            mailer.sendMail({
                                from: 'Whigi <whigi.com@gmail.com>',
                                to: '<' + sharee.email + '>',
                                subject: 'New data shared',
                                html: 'Data named <b>' + v.data_name + '</b> was shared to you by ' + req.user.email + '.'
                            }, function(e, i) {});
                        });
                        res.type('application/json').status(201).json({error: ''});
                    }, function(e) {
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    });
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
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
    req.user.fill().then(function() {
        if(!(req.params.data_name in req.user.data)) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        } else {
            if(req.params.shared_to_id in req.user.data[req.params.data_name].shared_to) {
                db.retrieveVault(req.user.data[req.params.data_name].shared_to[req.params.shared_to_id]).then(function(v: Vault) {
                    v.unlink().then(function() {
                        delete req.user.data[req.params.data_name].shared_to[req.params.shared_to_id];
                        req.user.persist().then(function() {
                            res.type('application/json').status(200).json({error: ''});
                        }, function(e) {
                            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                        });
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