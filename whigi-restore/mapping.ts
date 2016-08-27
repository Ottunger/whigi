/**
 * API dealing with users, for restoring their password.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var utils = require('../utils/utils');
import {Mapping} from '../common/models/Mapping';
var mailer, db;

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
 */
export function managerInit(dbg) {
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
 * Learns a new user mapping from Whigi.
 * @function newMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function newMapping(req, res) {
    var got = req.body;
    if(got.key == require('../common/key.json').key) {
        var newid = utils.generateRandomString(32);
        var key = got.safe? got.master_key.slice(got.master_key.length / 2, got.master_key.length) : got.master_key;
        var m: Mapping = new Mapping(newid, got.email, key, 0, '', '', got.id, got.safe, got.safe? got.recup_mail : 'none', db);
        m.persist().then(function() {
            res.type('application/json').status(201).json({error: '', _id: newid});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    } else {
        res.type('application/json').status(401).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Requests a mapping to be sent upon click in mail.
 * @function requestMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function requestMapping(req, res) {
    db.collection('mappings').findOne({email: req.params.email}).then(function(map) {
        if(map === undefined || map == null) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
        } else {
            var m: Mapping = new Mapping(map._id, map.email, map.master_key, map.time_changed, map.pwd_key, map.token, map.bearer_id, map.safe, map.recup_mail, db);
            if((new Date).getTime() - m.time_changed > 30*60*1000) {
                //Create a token
                var newid = utils.generateRandomString(64);
                utils.persistToken(newid, m.bearer_id).then(function() {
                    m.time_changed = (new Date).getTime();
                    m.pwd_key = utils.generateRandomString(64);
                    m.token = newid;
                    m.persist().then(function() {
                        mailer.sendMail({
                            from: 'Whigi <' + utils.MAIL_ADDR + '>',
                            to: '<' + m.email + '>',
                            subject: utils.i18n('mail.subject.account', req),
                            html: utils.i18n('mail.body.reset', req) + '<br /> \
                                <a href="' + utils.RUNNING_ADDR + '/password-recovery/' + m.pwd_key + '/' + encodeURIComponent(m.recup_mail) + '">' +
                                utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                        }, function(e, i) {});
                        if(m.safe) {
                            mailer.sendMail({
                                from: 'Whigi <' + utils.MAIL_ADDR + '>',
                                to: '<' + m.recup_mail + '>',
                                subject: utils.i18n('mail.subject.needRestore', req),
                                html: utils.i18n('mail.body.needRestore', req) + m.email + '.<br />' + utils.i18n('mail.signature', req)
                            }, function(e, i) {});
                        }
                        res.type('application/json').status(201).json({error: ''});
                    }, function(e) {
                        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                    });
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                res.type('application/json').status(400).json({error: utils.i18n('client.tooSoon', req)});
            }
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Sends back the master key if confirmed possible.
 * @function retrieveMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function retrieveMapping(req, res) {
    db.collection('mappings').findOne({pwd_key: req.params.token}).then(function(map) {
        if(map === undefined || map == null) {
            res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
        } else {
            var m: Mapping = new Mapping(map._id, map.email, map.master_key, map.time_changed, map.pwd_key, map.token, map.bearer_id, map.safe, map.recup_mail, db);
            if((new Date).getTime() - m.time_changed < 30*60*1000) {
                m.time_changed = 0;
                m.pwd_key = "";
                m.persist().then(function() {
                    res.type('application/json').status(200).json(m.sanitarize(true));
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            } else {
                res.type('application/json').status(412).json({error: utils.i18n('client.tooSoon', req)});
            }
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}