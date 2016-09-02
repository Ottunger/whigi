/**
 * API dealing with users, for restoring their password.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var https = require('https');
var aes = require('aes-js');
var RSA = require('node-rsa');
var utils = require('../utils/utils');
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
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': 'Basic ' + new Buffer('whigi-restore:' + require('./password.json').pwd).toString('base64')
        }
    };
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
 * Turns a string to an array of numbers.
 * @function str2arr
 * @public
 * @param {String} str String.
 * @return {Number[]} Array.
 */
function str2arr(str: string): number[] {
    var result: number[] = [];
    for (var i = 0; i < str.length; i++) {
        result.push(parseInt(str.charCodeAt(i).toString(10)));
    }
    return result;
}

/**
 * Decrypt an AES key using RSA.
 * @function decryptRSA
 * @public
 * @param {String} Encrypted data.
 * @param {String} rsa_key Key.
 * @return {Bytes} Decrypted data, we use AES keys.
 */
function decryptRSA(data: string, rsa_key: string): number[] {
    var dec = new RSA();
    dec.setPrivateKey(rsa_key);
    return str2arr(dec.decrypt(data));
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
    return aes.util.convertBytesToString(aes.ModeOfOperation.ctr(key, new aes.Counter(0)).decrypt(str2arr(data)));
}

/**
 * Requests a mapping to be sent upon click in mail.
 * @function requestMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function requestMapping(req, res) {
    function complete(recup, mk, pk, data) {
        if(recup) {
            whigi('GET', '/vault/' + data.shared_with_me[req.params.id]['profile/recup_id']).then(function(vault) {
                var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
                var recup_id = decryptAES(vault.data_crypted_aes, aesKey);
                whigi('GET', '/vault/' + data.shared_with_me[recup_id]['profile/email']).then(function(vault) {
                    var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var recup_mail = decryptAES(vault.data_crypted_aes, aesKey);
                    mailer.sendMail({
                        from: 'Whigi <' + utils.MAIL_ADDR + '>',
                        to: '<' + recup_mail + '>',
                        subject: utils.i18n('mail.subject.otherAccount', req),
                        html: utils.i18n('mail.body.otherAccount', req) + '<br /> \
                            <a href="' + utils.RUNNING_ADDR + '/password-help/' + encodeURIComponent(req.params.id) + '">' +
                            utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                    }, function(e, i) {});
                }, function(e) {
                    res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                });
            }, function(e) {
                res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
            });
        } else {
            whigi('GET', '/vault/' + data.shared_with_me[req.params.id]['profile/email']).then(function(vault) {
                var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
                var email = decryptAES(vault.data_crypted_aes, aesKey);
                whigi('GET', '/vault/' + data.shared_with_me[req.params.id]['keys/pwd/mine1']).then(function(vault) {
                    var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var mine1 = decryptAES(vault.data_crypted_aes, aesKey);
                    whigi('GET', '/vault/' + data.shared_with_me[req.params.id]['keys/pwd/mine2']).then(function(vault) {
                        var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
                        var mine2 = decryptAES(vault.data_crypted_aes, aesKey);
                        mailer.sendMail({
                            from: 'Whigi <' + utils.MAIL_ADDR + '>',
                            to: '<' + email + '>',
                            subject: utils.i18n('mail.subject.account', req),
                            html: utils.i18n('mail.body.reset', req) + '<br /> \
                                <a href="' + utils.RUNNING_ADDR + '/password-recovery/' + encodeURIComponent(req.params.id) +
                                '/' + encodeURIComponent(mine1 + mine2) + '">' +
                                utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                        }, function(e, i) {});
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
    }

    whigi('GET', '/api/v1/profile').then(function(profile) {
        var key = this.toBytes(sessionStorage.getItem('key_decryption'));
        var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
        var master_key = decrypter.decrypt(this.profile.encr_master_key);
        decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
        var rsa_key = aes.util.convertBytesToString(decrypter.decrypt(this.profile.rsa_pri_key));
        req.params.id = decodeURIComponent(req.params.id);
        whigi('GET', '/api/v1/profile/data').then(function(data) {
            if(!!data.shared_with_me[req.params.id]['profile/email'] && !!data.shared_with_me[req.params.id]['keys/pwd/mine1']) {
                if(!!data.shared_with_me[req.params.id]['profile/recup_id']) {
                    complete(true, master_key, rsa_key, data);
                } else if(!!data.shared_with_me[req.params.id]['keys/pwd/mine2']) {
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
 * @function retrieveMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function mixMapping(req, res) {
    function complete(mk, pk, data) {
        whigi('GET', '/vault/' + data.shared_with_me[req.params.id]['profile/email']).then(function(vault) {
            var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
            var email = decryptAES(vault.data_crypted_aes, aesKey);
            whigi('GET', '/vault/' + data.shared_with_me[req.params.id]['keys/pwd/mine1']).then(function(vault) {
                var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, pk);
                var mine1 = decryptAES(vault.data_crypted_aes, aesKey);
                mailer.sendMail({
                    from: 'Whigi <' + utils.MAIL_ADDR + '>',
                    to: '<' + email + '>',
                    subject: utils.i18n('mail.subject.account', req),
                    html: utils.i18n('mail.body.reset', req) + '<br /> \
                        <a href="' + utils.RUNNING_ADDR + '/password-recovery/' + encodeURIComponent(req.params.id) +
                        '/' + encodeURIComponent(mine1 + decodeURIComponent(req.params.half)) + '">' +
                        utils.i18n('mail.body.click', req) + '</a><br />' + utils.i18n('mail.signature', req)
                }, function(e, i) {});
            }, function(e) {
                res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
            });
        }, function(e) {
            res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
        });
    }

    whigi('GET', '/api/v1/profile').then(function(profile) {
        var key = this.toBytes(sessionStorage.getItem('key_decryption'));
        var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
        var master_key = decrypter.decrypt(this.profile.encr_master_key);
        decrypter = new aes.ModeOfOperation.ctr(this.master_key, new aes.Counter(0));
        var rsa_key = aes.util.convertBytesToString(decrypter.decrypt(this.profile.rsa_pri_key));
        req.params.id = decodeURIComponent(req.params.id);
        whigi('GET', '/api/v1/profile/data').then(function(data) {
            if(!!data.shared_with_me[req.params.id]['profile/email'] && !!data.shared_with_me[req.params.id]['keys/pwd/mine1']) {
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