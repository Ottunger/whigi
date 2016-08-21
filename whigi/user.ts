/**
 * API dealing with users, their profile and registration.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var utils = require('../utils/utils');
var hash = require('js-sha256');
var aes = require('nodejs-aes256');
var RSA = require('node-rsa');
import {User} from '../common/models/User';
import {Datafragment} from '../common/models/Datafragment';
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
    if(req.user.is_activated) {
        res.type('application/json').status(200).json(Object.assign({puzzle: req.user.puzzle}, req.user.sanitarize()));
    } else {
        res.type('application/json').status(404).json(Object.assign({puzzle: req.user.puzzle}, {error: utils.i18n('client.noUser', req)}));
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
 * Forges the response to list all possessed data as json, or HTTP 500 code.
 * @function listData
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function listData(req, res) {
    req.user.fill().then(function() {
        res.type('application/json').status(200).json(req.user.data);
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
 */
export function recData(req, res) {
    var got = req.body;
    req.user.fill().then(function() {
        var newid = utils.generateRandomString(64);
        req.user.data[got.name] = {
            id: newid,
            length: Buffer.byteLength(got.encr_data, 'utf8'),
            shared_to: {}
        }
        var frg: Datafragment = new Datafragment(newid, got.encr_data, db);
        frg.persist().then(function() {
            req.user.persist().then(function() {
                res.type('application/json').status(201).json(Object.assign({puzzle: req.user.puzzle}, {error: ''}));
            }, function(e) {
                res.type('application/json').status(500).json(Object.assign({puzzle: req.user.puzzle}, {error: utils.i18n('internal.db', req)}));
            });
        }, function(e) {
            res.type('application/json').status(500).json(Object.assign({puzzle: req.user.puzzle}, {error: utils.i18n('internal.db', req)}));
        });
    }, function(e) {
        res.type('application/json').status(500).json(Object.assign({puzzle: req.user.puzzle}, {error: utils.i18n('internal.db', req)}));
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
    req.user.applyUpdate(upt);
    req.user.persist();
    res.type('application/json').status(200).json({error: ''});
}

/**
 * Forges the response to the registration of a user. Can be HTTP 201 or 400 or 500.
 * @function regUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function regUser(req, res) {
    var user = req.body;
    function complete() {
        var u: User = new User(user, db);
        var pre_master_key = utils.generateRandomString(64);
        var key = new RSA();
        key.generateKeyPair(4096, 65537);

        u._id = utils.generateRandomString(32);
        u.salt = utils.generateRandomString(64);
        u.puzzle = utils.generateRandomString(16);
        u.password = hash.sha256(hash.sha256(user.password) + u.salt);
        u.is_activated = false;
        u.key = utils.generateRandomString(64);
        u.encr_master_key = aes.encrypt(user.password, pre_master_key);
        u.rsa_pub_key = key.exportKey('public');
        u.rsa_pri_key = key.exportKey('private');
        utils.registerMapping(u.email, pre_master_key, function(err) {
            if(err) {
                res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
            } else {
                u.persist().then(function() {
                    mailer.sendMail({
                        from: 'Whigi <whigi.com@gmail.com>',
                        to: '<' + u.email + '>',
                        subject: 'Your account',
                        html: 'Click here to activate your account:<br /> \
                            <a href="' + utils.RUNNING_ADDR + '/api/v1/activate/' + u.key + '/' + u._id + '">Click here</a><br /> \
                            The Whigi team.'
                    }, function(e, i) {});
                    res.type('application/json').status(201).json({error: ''});
                }, function(e) {
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                });
            }
        });
    }
    function towards() {
        db.retrieveUser('email', user.email).then(function(u) {
            if(u === undefined)
                complete();
            else
                res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
        }, function(e) {
            complete();
        });
    }

    utils.checkCaptcha(req.query.captcha, function(ok) {
        if(ok) {
            if('first_name' in user && 'last_name' in user && 'username' in user && 'password' in user && 'email' in user) {
                if(user.first_name.length > 0 && user.last_name.length > 0 && user.username.length > 0 && user.password.length > 0 && user.email.length > 0 && /^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(user.email)) {
                    db.retrieveUser('username', user.username).then(function(u) {
                        if(u === undefined)
                            towards();
                        else
                            res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
                    }, function(e) {
                        towards();
                    });
                } else {
                    res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
                }
            } else {
                res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
            }
        } else {
            res.type('application/json').status(400).json({error: utils.i18n('client.captcha', req)});
        }
    });
}

/**
 * Activates a user account. Can be HTTP 200 or 400 or 404 or 500.
 * @function activateUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function activateUser(req, res) {
    db.retrieveUser('key', req.params.key).then(function(user) {
        if(user != undefined) {
            user.is_activated = true;
            user.persist();
            res.redirect('/');
        } else {
            res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Deactivates a user account. Can be HTTP 200 or 500.
 * @function deactivateUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function deactivateUser(req, res) {
    req.user.is_activated = false;
    req.user.persist();
    res.type('application/json').status(200).json({error: ''});
}
