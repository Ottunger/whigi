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
var aes = require('aes-js');
var RSA = require('node-rsa');
import {User} from '../common/models/User';
import {Datafragment} from '../common/models/Datafragment';
import {Token} from '../common/models/Token';
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
    var dec = decodeURIComponent(req.params.id);
    db.retrieveUser('id', dec).then(function(user) {
        if(!!user && !!(user.is_activated)) {
            res.type('application/json').status(200).json(Object.assign({puzzle: req.user.puzzle}, user.sanitarize()));
        } else {
            res.type('application/json').status(404).json({puzzle: req.user.puzzle, error: utils.i18n('client.noUser', req)});
        }
    }, function(e) {
        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
    });

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
        res.type('application/json').status(200).json({
            data: req.user.data,
            shared_with_me: req.user.shared_with_me
        });
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
 * @param {Boolean} respond Whether to answer in res.
 */
export function recData(req, res, respond?: boolean) {
    var got = req.body;
    respond = respond || true;
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
                if(!!respond)
                    res.type('application/json').status(201).json({puzzle: req.user.puzzle, error: '', _id: newid});
            }, function(e) {
                if(!!respond)
                    res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
            });
        }, function(e) {
            if(!!respond)
                res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
        });
    }, function(e) {
        if(!!respond)
            res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
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
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Forges the response to the registration of a user.
 * @function regUser
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function regUser(req, res) {
    var user = req.body;
    function end(u: User) {
        u.persist().then(function() {
            mailer.sendMail({
                from: 'Whigi <' + utils.MAIL_ADDR + '>',
                to: '<' + u.email + '>',
                subject: utils.i18n('mail.subject.account', req),
                html: utils.i18n('mail.body.account', req) + '<br /> \
                    <a href="' + utils.RUNNING_ADDR + '/api/v1/activate/' + u.key + '/' + u._id + '">' + utils.i18n('mail.body.click', req) + '</a><br />' +
                    utils.i18n('mail.signature', req)
            }, function(e, i) {});
            res.type('application/json').status(201).json({error: ''});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    }
    function complete() {
        var u: User = new User(user, db);
        var pre_master_key: string = utils.generateRandomString(64);
        var key = new RSA();
        key.generateKeyPair(4096, 65537);

        u._id = utils.generateRandomString(32);
        u.salt = utils.generateRandomString(64);
        u.puzzle = utils.generateRandomString(16);
        u.password = hash.sha256(hash.sha256(user.password) + u.salt);
        u.is_activated = false;
        u.key = utils.generateRandomString(64);
        u.data = {};
        u.shared_with_me = {};
        u.encr_master_key = new aes.ModeOfOperation.ctr(utils.toBytes(hash.sha256(user.password + u.salt)), new aes.Counter(0))
            .encrypt(utils.toBytes(pre_master_key));
        u.rsa_pub_key = key.exportKey('public');
        u.rsa_pri_key = new aes.ModeOfOperation.ctr(utils.toBytes(hash.sha256(user.password + u.salt)), new aes.Counter(0))
            .encrypt(aes.util.convertStringToBytes(key.exportKey('private')));
        if(user.recuperable) {
            utils.registerMapping(u._id, u.email, user.safe, user.recup_mail, pre_master_key, function(err) {
                if(err) {
                    res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                } else {
                    if(user.safe) {
                        mailer.sendMail({
                            from: 'Whigi <' + utils.MAIL_ADDR + '>',
                            to: '<' + user.recup_mail + '>',
                            subject: utils.i18n('mail.subject.otherAccount', req),
                            html: utils.i18n('mail.body.account', req) + '<br /> \
                                <a href="' + utils.RUNNING_ADDR + '/save-key/' + encodeURIComponent(u.email) + '/' + pre_master_key.slice(0, pre_master_key.length / 2) + '">' +
                                utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                        }, function(e, i) {});
                        end(u);
                    } else {
                        end(u);
                    }
                }
            });
        } else {
            end(u);
        }
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
            if(user.first_name.length > 0 && user.last_name.length > 0 && user.username.length > 0 && user.password.length > 0 && user.email.length > 0 && /^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(user.email)) {
                if(user.recuperable && user.safe && !/^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(user.recup_mail)) {
                    res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
                } else {
                    db.retrieveUser('username', user.username).then(function(u) {
                        if(u == undefined)
                            towards();
                        else
                            res.type('application/json').status(400).json({error: utils.i18n('client.userExists', req)});
                    }, function(e) {
                        towards();
                    });
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
            user.persist().then(function() {
                res.redirect('/');
            }, function(e) {
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            });
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
    req.user.persist().then(function() {
        res.type('application/json').status(200).json({error: ''});
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}

/**
 * Creates a new token for the user to log in.
 * @function newToken
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function newToken(req, res) {
    var newid = utils.generateRandomString(64);
    var t: Token = new Token(newid, req.user._id, (new Date).getTime(), req.body.is_eternal, db);
    t.persist().then(function() {
        res.type('application/json').status(201).json({puzzle: req.user.puzzle, error: '', _id: newid});
    }, function(e) {
        res.type('application/json').status(500).json({puzzle: req.user.puzzle, error: utils.i18n('internal.db', req)});
    });
}

/**
 * Removes tokens for the bearer.
 * @function removeToken
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function removeToken(req, res) {
    db.retrieveToken({bearer_id: req.user._id}).then(function(t: Token) {
        if(!!t) {
            t.unlink().then(function() {
                removeToken(req, res);
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
 * Creates a auth token on behalf of Whigi restore.
 * @function restoreToken
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function restoreToken(req, res) {
    var got = req.body;
    if(got.key == require('../common/key.json').key) {
        var t: Token = new Token(got.token_id, got.bearer_id, (new Date).getTime(), false, db);
        t.persist().then(function() {
            res.type('application/json').status(201).json({error: '', _id: got.token_id});
        }, function(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
        });
    } else {
        res.type('application/json').status(401).json({error: utils.i18n('client.auth', req)});
    }
}
