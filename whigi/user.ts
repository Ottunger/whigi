/**
 * API dealing with users, their profile, rating and registration.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var utils = require('../utils/utils');
var hash = require('js-sha256');
import {User} from '../common/models/user';
import {Datasource} from './datasources/datasources';

export class UserManager{

    private mailer;
    private db: Datasource;

    /**
     * Sets up the mailer before use.
     * @function constructor
     * @public
     */
    constructor() {
        this.mailer = ndm.createTransport({
            service: 'Gmail',
            auth: {
                user: 'whigi.com@gmail.com',
                pass: 'nNP36gFYmMeND3dIoKwR'
            }
        });
    }

    /**
     * Forges the response to some user info as json, or HTTP 500 code.
     * @function getUser
     * @public
     * @param {Request} req The request.
     * @param {Response} res The response.
     */
    getUser(req, res) {
        this.db.retrieveUser('id', parseInt(req.params.id)).then(function(user) {
            if(user.is_activated) {
                res.type('application/json').status(200).json(user.sanitarize());
            } else
                res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    /**
     * Forges the response to the authenticated user info as json, or HTTP 500 code.
     * @function getProfile
     * @public
     * @param {Request} req The request.
     * @param {Response} res The response.
     */
    getProfile(req, res) {
        this.db.retrieveUser('username', utils.authUserName(req)).then(function(usr) {
            res.type('application/json').status(200).json(usr.fields());
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    /**
     * Forges the response to update a user. Can return HTTP 200, 400 or 500 code.
     * @function updateUser
     * @public
     * @param {Request} req The request.
     * @param {Response} res The response.
     */
    updateUser(req, res) {
        var upt = req.body;
        this.db.retrieveUser('username', utils.authUserName(req)).then(function(user) {
            user.applyUpdate(upt);
            user.persist();
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

    /**
     * Forges the response to the registration of a user. Can be HTTP 201 or 400 or 500.
     * @function regUser
     * @public
     * @param {Request} req The request.
     * @param {Response} res The response.
     */
    regUser(req, res) {
        var user = req.body;
        utils.checkCaptcha(req.query.captcha, function(ok) {
            if(ok) {
                if('first_name' in user && 'last_name' in user && 'username' in user && 'password' in user && 'email' in user) {
                    if(user.first_name.length > 0 && user.last_name.length > 0 && user.username.length > 0 && user.password.length > 0 && user.email.length > 0 && /^([\w-]+(?:\.[\w-]+)*)@(student\.)?ulg\.ac\.be$/i.test(user.email)) {
                        this.db.retrieveUser('username', user.username).then(function(u) {
                            res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
                        }, function(e) {
                            this.db.retrieveUser('email', user.email).then(function(u) {
                                res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
                            }, function(e) {
                                var u: User = new User(user);
                                u.salt = utils.generateRandomString(64);
                                u.puzzle = utils.generateRandomString(16);
                                u.password = hash.sha256(user.password + u.salt);
                                u.is_activated = false;
                                u.key = utils.generateRandomString(64);
                                u.persist();
                                this.mailer.sendMail({
                                    from: 'Whigi <whigi.com@gmail.com>',
                                    to: '<' + u.email + '>',
                                    subject: 'Your account',
                                    html: 'Click here to activate your account:<br /> \
                                        <a href="' + utils.RUNNING_ADDR + '/api/v1/activate/' + u.key + '/' + u._id + '">Click here</a><br /> \
                                        The Whigi team.'
                                }, function(e, i) {});
                                res.type('application/json').status(201).json({error: ''});
                            });
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
    activateUser(req, res) {
        this.db.retrieveUser('key', req.params.key).then(function(user) {
            if(user != undefined) {
                user.is_activated = true;
                user.persist();
                res.redirect('/index.html');
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
    deactivateUser(req, res) {
        this.db.retrieveUser('username', utils.authUserName(req)).then(function(user) {
            user.is_activated = false;
            user.persist();
            res.type('application/json').status(200).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

}
