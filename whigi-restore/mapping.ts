/**
 * API dealing with users, for restoring their password.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var https = require('https');
var hash = require('js-sha256');
var aes = require('aes-js');
var utils = require('../utils/utils');
var mailer;

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
 */
export function managerInit() {
    mailer = ndm.createTransport({
        service: 'Gmail',
        auth: {
            user: 'whigi.com@gmail.com',
            pass: 'nNP36gFYmMeND3dIoKwR'
        }
    });
}

/**
 * Sends a request to Whigi
 * @function whigi
 * @private
 * @param {String} method Method.
 * @param {String} path End point.
 * @param {Object} data Data.
 * @return {Promise} Promise.
 */
function whigi(method: string, path: string, data?: any): Promise {
    var options = {
        host: utils.WHIGIHOST,
        port: 443,
        path: '/api/v1' + path,
        method: method,
        headers: {
          'Authorization': 'Basic ' + new Buffer('whigi-restore:' + hash.sha256(require('./password.json').pwd)).toString('base64')
        }
    };
    if(method == 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    return new Promise(function(resolve, reject) {
        var ht = https.request(options, function(res) {
            var r = '';
            res.on('data', function(chunk) {
                r += chunk;
            });
            res.on('end', function() {
                resolve(JSON.parse(r));
            });
        }).on('error', function(err) {
            reject(err);
        });
        if(method == 'POST')
            ht.write(data);
        ht.end();
    });
}

/**
 * Decrypt a string using master_key in AES.
 * @function decryptAES
 * @public
 * @param {String} data Data to decrypt.
 * @param {Bytes} key Key to use.
 * @return {String} Result.
 */
function decryptAES(data: string, key: number[]): string {
    return aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(key, new aes.Counter(0)).decrypt(utils.str2arr(data)));
}

/**
 * Requests a mapping to be sent upon click in mail.
 * @function requestMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function requestMapping(req, res) {
    var username = req.params.id.toLowerCase();
    function complete(recup, mk, pk, data) {
        try {
            if(recup) {
                whigi('GET', '/vault/' + data.shared_with_me[username]['profile/recup_id']).then(function(vault) {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var recup_id = decryptAES(vault.data_crypted_aes, aesKey).toLowerCase();
                    if(!(recup_id in data.shared_with_me)) {
                        res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
                        return;
                    }
                    whigi('GET', '/vault/' + data.shared_with_me[recup_id]['profile/email/restore']).then(function(vault) {
                        var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                        var recup_mail = decryptAES(vault.data_crypted_aes, aesKey);
                        mailer.sendMail({
                            from: 'Whigi <' + utils.MAIL_ADDR + '>',
                            to: '<' + recup_mail + '>',
                            subject: utils.i18n('mail.subject.otherAccount', req),
                            html: utils.i18n('mail.body.otherAccount', req) + '<br /> \
                                <a href="' + utils.RUNNING_ADDR + '/password-help/' + username + '/keys%2Fpwd%2Fmine2">' +
                                utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                        }, function(e, i) {});
                        res.type('application/json').status(200).json({error: ''});
                    }, function(e) {
                        res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                    });
                }, function(e) {
                    res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                });
            } else {
                whigi('GET', '/vault/' + data.shared_with_me[username]['profile/email/restore']).then(function(vault) {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var email = decryptAES(vault.data_crypted_aes, aesKey);
                    whigi('GET', '/vault/' + data.shared_with_me[username]['keys/pwd/mine1']).then(function(vault) {
                        var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                        var mine1 = decryptAES(vault.data_crypted_aes, aesKey);
                        whigi('GET', '/vault/' + data.shared_with_me[username]['keys/pwd/mine2']).then(function(vault) {
                            var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                            var mine2 = decryptAES(vault.data_crypted_aes, aesKey);
                            mailer.sendMail({
                                from: 'Whigi <' + utils.MAIL_ADDR + '>',
                                to: '<' + email + '>',
                                subject: utils.i18n('mail.subject.account', req),
                                html: utils.i18n('mail.body.reset', req) + '<br /> \
                                    <a href="' + utils.RUNNING_ADDR + '/password-recovery/' + username +
                                    '/' + encodeURIComponent(mine1 + mine2) + '">' +
                                    utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                            }, function(e, i) {});
                            res.type('application/json').status(200).json({error: ''});
                        }, function(e) {
                            res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                        });
                    }, function(e) {
                        res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                    });
                }, function(e) {
                    res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                });
            }
        } catch(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.keys', req)});
        }
    }

    whigi('GET', '/profile').then(function(profile) {
        var key = utils.toBytes(hash.sha256(require('./password.json').pwd + profile.salt));
        var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
        var master_key = Array.from(decrypter.decrypt(profile.encr_master_key));
        decrypter = new aes.ModeOfOperation.ctr(master_key, new aes.Counter(0));
        var rsa_key = aes.util.convertBytesToString(decrypter.decrypt(profile.rsa_pri_key[0]));
        whigi('GET', '/profile/data').then(function(data) {
            if(!!data && !!data.shared_with_me && !!data.shared_with_me[username] && !!data.shared_with_me[username]['profile/email/restore'] && !!data.shared_with_me[username]['keys/pwd/mine1']) {
                if(!!data.shared_with_me[username]['profile/recup_id']) {
                    complete(true, master_key, rsa_key, data);
                } else if(!!data.shared_with_me[username]['keys/pwd/mine2']) {
                    complete(false, master_key, rsa_key, data);
                } else {
                    res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
                }
            } else {
                res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
            }
        }, function(e) {
            res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
        });
    }, function(e) {
        res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
    });
}

/**
 * Says the half key and send mail.
 * @function mixMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function mixMapping(req, res) {
    var username = req.params.id.toLowerCase();
    function complete(mk, pk, data) {
        try {
            whigi('GET', '/vault/' + data.shared_with_me[username]['profile/email/restore']).then(function(vault) {
                var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                var email = decryptAES(vault.data_crypted_aes, aesKey);
                whigi('GET', '/vault/' + data.shared_with_me[username]['keys/pwd/mine1']).then(function(vault) {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var mine1 = decryptAES(vault.data_crypted_aes, aesKey);
                    mailer.sendMail({
                        from: 'Whigi <' + utils.MAIL_ADDR + '>',
                        to: '<' + email + '>',
                        subject: utils.i18n('mail.subject.account', req),
                        html: utils.i18n('mail.body.reset', req) + '<br /> \
                            <a href="' + utils.RUNNING_ADDR + '/password-recovery/' + username +
                            '/' + encodeURIComponent(mine1 + decodeURIComponent(req.params.half)) + '">' +
                            utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                    }, function(e, i) {});
                    res.type('application/json').status(200).json({error: ''});
                }, function(e) {
                    res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                });
            }, function(e) {
                res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
            });
        } catch(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.keys', req)});
        }
    }

    whigi('GET', '/profile').then(function(profile) {
        var key = utils.toBytes(hash.sha256(require('./password.json').pwd + profile.salt));
        var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
        var master_key = Array.from(decrypter.decrypt(profile.encr_master_key));
        decrypter = new aes.ModeOfOperation.ctr(master_key, new aes.Counter(0));
        var rsa_key = aes.util.convertBytesToString(decrypter.decrypt(profile.rsa_pri_key[0]));
        whigi('GET', '/profile/data').then(function(data) {
            if(!!data && !!data.shared_with_me && !!data.shared_with_me[username] && !!data.shared_with_me[username]['profile/email/restore'] && !!data.shared_with_me[username]['keys/pwd/mine1']) {
                complete(master_key, rsa_key, data);
            } else {
                res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
            }
        }, function(e) {
            res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
        });
    }, function(e) {
        res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
    });
}