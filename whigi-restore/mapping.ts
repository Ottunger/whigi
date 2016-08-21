/**
 * API dealing with users, for restoring their password.
 * @module user
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
        var m: Mapping = new Mapping(utils.generateRandomString(32), got.email, got.master_key, 0, '', db);
        m.persist().then(function() {
            res.type('application/json').status(201).json({error: ''});
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
            var m: Mapping = new Mapping(map._id, map.email, map.master_key, map.time_changed, map.pwd_key, db);
            if((new Date).getTime() - m.time_changed > 30*60*1000) {
                m.time_changed = (new Date).getTime();
                m.pwd_key = utils.generateRandomString(64);
                m.persist().then(function() {
                    mailer.sendMail({
                        from: 'Whigi <whigi.com@gmail.com>',
                        to: '<' + m.email + '>',
                        subject: 'Your account',
                        html: 'Click here to change your password:<br /> \
                            <a href="' + utils.RUNNING_ADDR + '/password-recovery/' + m.pwd_key + '">Click here</a><br /> \
                            The Whigi team.'
                    }, function(e, i) {});
                    res.type('application/json').status(201).json({error: ''});
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
            var m: Mapping = new Mapping(map._id, map.email, map.master_key, map.time_changed, map.pwd_key, db);
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