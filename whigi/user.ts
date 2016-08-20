/**
 * API dealing with users, their profile, rating and registration.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
var hash = require('js-sha256');
var ndm = require('nodemailer');
var utils = require('./utils');
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
            if(user != undefined && user.is_activated) {
                delete user.pwd_key;
                delete user.key;
                delete user.is_activated;
                delete user.state;
                delete user.password;
                delete user.salt;
                delete user.notifications;
                if('history' in user)
                    delete user.history;
                if('positions' in user)
                    delete user.positions;
                delete user.preferred_paths;
                if(user.address_public == false)
                    delete user.address;
                if(user.phone_public == false)
                    delete user.phone_nb;
                user.id = user._id;
                res.type('application/json').status(200).json(user);
            } else
                res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }

}

/**
 * Forges the response to the authenticated user info as json, or HTTP 500 code.
 * @function getProfile
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.getProfile = function(req, res) {
    api.retrieveItem('users', 'username', api.authUserName(req), true, function(e, usr) {
        if(!e) {
            delete usr.pwd_key;
            delete usr.key;
            delete usr.password;
            delete usr.salt;
            delete usr.notifications;
            if('history' in usr)
                delete usr.history;
            if('positions' in usr)
                delete usr.positions;
            if('preferred_paths' in usr && usr.preferred_paths.length > 0) {
                var ppath = [];
                api.loopOn(usr.preferred_paths, function(item, recall) {
                    api.getPath(item, recall);
                }, function(item, p) {
                    if(p != undefined && '_id' in p) {
                        ppath.push(p);
                    }
                }, function() {
                    usr.preferred_paths = ppath;
                    usr.id = usr._id;
                    res.type('application/json').status(200).json(usr);
                    api.logDone('REQ_PROFILE', req);
                });
            } else {
                usr.id = usr._id;
                res.type('application/json').status(200).json(usr);
                api.logDone('REQ_PROFILE', req);
            }
        } else {
            res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
        }
    });
}

/**
 * Forges the response to request a preferred path by id. Can return HTTP 200, 403, 404 or 500 code.
 * @function getPreferredPath
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.getPreferredPath = function(req, res) {
    api.retrieveItem('users', 'username', api.authUserName(req), true, function(e, usr) {
        if(!e) {
            if('preferred_paths' in usr) {
                for(var i = 0; i < req.params.id - 2; i++)
                    usr.preferred_paths.pop();
                var pathid = usr.preferred_paths.pop();
                if(pathid != undefined) {
                    api.getPath(pathid, function(p) {
                        if(p != undefined && '_id' in p) {
                            res.type('application/json').status(200).json(p);
                        } else {
                            res.type('application/json').status(404).json({error: api.i18n('client.noPref', req)});
                        }
                    });
                } else {
                    res.type('application/json').status(404).json({error: api.i18n('client.noPref', req)});
                }
            } else {
                res.type('application/json').status(404).json({error: api.i18n('client.noPref', req)});
            }
        } else {
            res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
        }
    });
}

/**
 * Registers a preferred path for the current user. Can return HTTP 201, 403, 404 or 500 code.
 * @function regPreferredPath
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.regPreferredPath = function(req, res) {
    var path = req.body;
    api.retrieveItem('users', 'username', api.authUserName(req), false, function(e, usr) {
        if('time' in path) {
            api.regPath(path, function(pathid) {
                if(pathid == 0) {
                    res.type('application/json').status(500).json({error: api.i18n('internal.db', req), puzzle: usr.puzzle});
                    return;
                }
                usr.preferred_paths = [pathid];
                res.type('application/json').status(201).json({error: '', puzzle: usr.puzzle});
                api.logDone('REQ_REGPPATH', req);
            });
        } else
            res.type('application/json').status(400).json({error: api.i18n('client.missing', req), puzzle: usr.puzzle});
    });
}

/**
 * Forges the response to update a user. Can return HTTP 200, 400 or 500 code.
 * @function updateUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.updateUser = function(req, res) {
    var upt = req.body;
    if('address_public' in upt && 'phone_public' in upt) {
        api.retrieveItem('users', 'username', api.authUserName(req), false, function(e, user) {
            if(!e) {
                if('password' in upt)
                    user.password = hash.sha256(upt.password + user.salt);
                if('address' in upt)
                    user.address = upt.address;
                if('phone_nb' in upt)
                    user.phone_nb = upt.phone_nb;
                if('car_type' in upt)
                    user.car_type = upt.car_type;
                if('car_color' in upt && /^#[0-9a-fA-F]{3}$/i.test(upt.car_color))
                    user.car_color = upt.car_color;
                if('car_plate' in upt && /^(1-)?[a-z]{3}-[0-9]{3}$/i.test(upt.car_plate))
                    user.car_plate = upt.car_plate;
                if('avatar_url' in upt)
                    user.avatar_url = upt.avatar_url;
                if('preferences' in upt) {
                    if('smoke' in upt.preferences)
                        user.preferences.smoke = upt.preferences.smoke == true;
                    if('eat' in upt.preferences)
                        user.preferences.eat = upt.preferences.eat == true;
                    if('music' in upt.preferences)
                        user.preferences.music = upt.preferences.music == true;
                }
                res.type('application/json').status(200).json({error: ''});
            } else
                res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
        });
    } else
        res.type('application/json').status(400).json({error: api.i18n('client.missing', req)});
}

/**
 * Forges the response to the registration of a user. Can be HTTP 201 or 400 or 500.
 * @function regUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.regUser = function(req, res) {
    var user = req.body;
    api.checkCaptcha(req.query.captcha, function(ok) {
        if(ok) {
            if('first_name' in user && 'last_name' in user && 'username' in user && 'password' in user && 'email' in user) {
                if(user.first_name.length > 0 && user.last_name.length > 0 && user.username.length > 0 && user.password.length > 0 && user.email.length > 0 && /^([\w-]+(?:\.[\w-]+)*)@(student\.)?ulg\.ac\.be$/i.test(user.email)) {
                    api.retrieveItem('users', 'username', user.username, true, function(e, u1) {
                        api.retrieveItem('users', 'email', user.email, true, function(ex, u2) {
                            if(!e && !ex && u1 == undefined && u2 == undefined) {
                                var ins = {};
                                ins.first_name = user.first_name;
                                ins.last_name = user.last_name;
                                ins.username = user.username;
                                ins.email = user.email;
                                ins.salt = api.generateRandomString(64);
                                ins.puzzle = api.generateRandomString(16);
                                ins.password = hash.sha256(user.password + ins.salt);
                                ins.state = {type: api.NONE, id: 0};
                                ins.notifications = [{link: '#', warn: 'Welcome dear user'}];
                                ins.is_activated = false;
                                ins.key = api.generateRandomString(64);
                                ins.pwd_key = '';
                                ins.address = '';
                                ins.address_public = false;
                                ins.phone_nb = '';
                                ins.phone_public = false;
                                ins.car_type = '';
                                ins.car_color = '#888';
                                ins.car_plate = '';
                                ins.avatar_url = '';
                                ins.driver_rating = 0.0;
                                ins.passenger_rating = 0.0;
                                ins.driver_rating_quantity = 0;
                                ins.passenger_rating_quantity = 0;
                                ins.history = [];
                                ins.preferences = {smoke: false, eat: false, music: false};
                                api.registerItem('users', ins, function(ex) {
                                    if(!ex) {
                                        api.statGlobal('users', 'created'),
                                        mailer.sendMail({
                                            from: 'CocarULg <cocarulg@gmail.com>',
                                            to: '<' + ins.email + '>',
                                            subject: 'Your account',
                                            html: 'Click here to activate your account:<br /> \
                                                <a href="' + api.RUNNING_ADDR + '/api/v1/activate/' + ins.key + '/' + ins._id + '">Click here</a><br /> \
                                                The CocarULg team.'
                                        }, function(e, i) {});
                                        res.type('application/json').status(201).json({error: ''});
                                        api.logDone('REQ_REGUSER', req);
                                    } else {
                                        res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
                                    }
                                });
                            } else {
                                res.type('application/json').status(400).json({error: api.i18n('client.userExists', req)});
                            }
                        });
                    });
                } else {
                    res.type('application/json').status(400).json({error: api.i18n('client.missing', req)});
                }
            } else {
                res.type('application/json').status(400).json({error: api.i18n('client.missing', req)});
            }
        } else
            res.type('application/json').status(400).json({error: api.i18n('client.captcha', req)});
    });
}

/**
 * Activates a user account. Can be HTTP 200 or 400 or 404 or 500.
 * @function activateUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.activateUser = function(req, res) {
    api.retrieveItem('users', 'key', req.params.key, false, function(e, user) {
        if(!e) {
            if(user != undefined) {
                user.is_activated = true;
                res.redirect('/index.html');
            } else {
                res.type('application/json').status(404).json({error: api.i18n('client.noUser', req)});
            }
        } else
            res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
    });
}

/**
 * Deactivates a user account. Can be HTTP 200 or 500.
 * @function deactivateUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.deactivateUser = function(req, res) {
    api.retrieveItem('users', 'username', api.authUserName(req), false, function(e, user) {
        if(!e) {
            user.is_activated = false;
            res.type('application/json').status(200).json({error: ''});
        } else
            res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
    });
}

/**
 * Gives a user a mean to reset password.
 * @function sendPwdUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.sendPwdUser = function(req, res) {
    if('email' in req.body) {
        api.retrieveItem('users', 'email', req.body.email, false, function(e, user) {
            if(!e) {
                if(user != undefined) {
                    var pwd_key = api.generateRandomString(64);
                    user.pwd_key = pwd_key;
                    api.deleteUserMapping(user);
                    api.createUserMapping(user);
                    mailer.sendMail({
                        from: 'CocarULg <cocarulg@gmail.com>',
                        to: '<' + user.email + '>',
                        subject: 'Your password',
                        html: 'Your username is ' + user.username + '.<br /> \
                            Click here to change your password:<br /> \
                            <a href="' + api.RUNNING_ADDR + '/pwdChange.html/' + pwd_key + '">Click here</a><br /> \
                            The CocarULg team.'
                    }, function(e, i) {});
                    res.type('application/json').status(200).json({error: ''});
                } else
                    res.type('application/json').status(404).json({error: api.i18n('client.noUser', req)});
            } else
                res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
        });
    } else 
        res.type('application/json').status(400).json({error: api.i18n('client.missing', req)});
}

/**
 * Returns whether a user has a pending mean to reset password.
 * @function isPwdUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.isPwdUser = function(req, res) {
    api.retrieveItem('users', 'pwd_key', req.params.key, true, function(e, user) {
        if(!e) {
            if(user != undefined) {
                res.type('application/json').status(200).json({error: ''});
            } else
                res.type('application/json').status(404).json({error: api.i18n('client.noUser', req)});
        } else
            res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
    });
}

/**
 * Gives a user a mean to reset password.
 * @function resetPwdUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
exports.resetPwdUser = function(req, res) {
    if('new_password' in req.body && req.body.new_password.length > 0) {
        api.retrieveItem('users', 'pwd_key', req.params.key, false, function(e, user) {
            if(!e) {
                if(user != undefined) {
                    user.password = hash.sha256(req.body.new_password + user.salt);
                    api.deleteUserMapping(user);
                    user.pwd_key = '';
                    api.createUserMapping(user);
                    res.type('application/json').status(200).json({error: ''});
                } else
                    res.type('application/json').status(404).json({error: api.i18n('client.noUser', req)});
            } else
                res.type('application/json').status(500).json({error: api.i18n('internal.db', req)});
        });
    } else 
        res.type('application/json').status(400).json({error: api.i18n('client.missing', req)});
}