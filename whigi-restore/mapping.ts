/**
 * API dealing with users, for restoring their password.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var https = require('https');
var fs = require('fs');
var hash = require('js-sha256');
var aes = require('aes-js');
var utils = require('../utils/utils');
var mailer, mapping;

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
 */
export function managerInit() {
    mailer = ndm.createTransport({
        port: 587,
        host: 'mail.wissl.org',
        secure: false,
        auth: {
            user: 'info@wissl.org',
            pass: 'ZwpmeNPuCb'
        },
        disableFileAccess: true,
        tls: {rejectUnauthorized: false}
    });
    mapping = {};
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
        key: fs.readFileSync(__dirname + '/../whigi/whigi-key.pem'),
        cert: fs.readFileSync(__dirname + '/whigi-restore-cert.pem')
    };
    if(method == 'POST') {
        data = JSON.stringify(data);
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
                var ret = JSON.parse(r);
                if('error' in ret)
                    reject(ret.error);
                else
                    resolve(ret);
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
 * Decrypt a string using specified AES key.
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
 * Encrypt a string using specifies AES key towards base64.
 * @function encryptAES
 * @public
 * @param {String} data Data to encrypt.
 * @param {Bytes} key Key to use.
 * @return {String} Result.
 */
function encryptAES(data: string, key: number[]): string {
    return (new aes.ModeOfOperation.ctr(key, new aes.Counter(0)).encrypt(aes.util.convertStringToBytes(data))).toString('base64');
}

/**
 * Get the aesKey once.
 * @function mapGet
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function mapGet(req, res) {
    if(req.params.key in mapping) {
        res.type('application/json').status(200).json({aes: mapping[req.params.key]});
        delete mapping[req.params.key];
    } else {
        res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
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
    var username = req.params.id.toLowerCase();
    function complete(recup, pk, data) {
        try {
            if(recup) {
                whigi('GET', '/vault/' + data.shared_with_me[username]['profile/recup_id']).then(function(vault) {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var recup_id = decryptAES(vault.data_crypted_aes, aesKey).toLowerCase();
                    if(!(recup_id in data.shared_with_me)) {
                        res.type('application/json').status(404).json({error: utils.i18n('client.noUser', req)});
                        return;
                    }
                    whigi('GET', '/vault/' + data.shared_with_me[recup_id]['profile/email']).then(function(vault) {
                        var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                        var recup_mail = decryptAES(vault.data_crypted_aes, aesKey);
                        whigi('GET', '/user/' + recup_id).then(function(remote) {
                            mailer.sendMail(utils.mailConfig(recup_mail, 'needRestore', req, {
                                username: username
                            }, remote), function(e, i) {});
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
            } else {
                whigi('GET', '/vault/' + data.shared_with_me[username]['profile/email']).then(function(vault) {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var email = decryptAES(vault.data_crypted_aes, aesKey);
                    whigi('GET', '/vault/' + data.shared_with_me[username]['keys/pwd/mine1']).then(function(vault) {
                        var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                        var mine1 = decryptAES(vault.data_crypted_aes, aesKey);
                        whigi('GET', '/vault/' + data.shared_with_me[username]['keys/pwd/mine2']).then(function(vault) {
                            var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                            var mine2 = decryptAES(vault.data_crypted_aes, aesKey);
                            //Forge key for AES retrieval, AES and encrypt.
                            aesKey = utils.toBytes(utils.generateRandomString(64));
                            var retKey = utils.generateRandomString(20);
                            mapping[retKey] = utils.arr2str(aesKey);
                            var encrypt = encryptAES(mine1 + mine2, aesKey);
                            whigi('GET', '/user/' + username).then(function(remote) {
                                mailer.sendMail(utils.mailConfig(email, 'reset', req, {
                                    username: username,
                                    secret: encodeURIComponent(encrypt),
                                    key: retKey
                                }, remote), function(e, i) {});
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
                }, function(e) {
                    res.type('application/json').status(600).json({error: utils.i18n('external.down', req)});
                });
            }
        } catch(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.keys', req)});
        }
    }

    whigi('GET', '/profile').then(function(profile) {
        var rsa_key = fs.readFileSync(__dirname + '/../whigi/whigi-key.pem');
        whigi('GET', '/profile/data').then(function(data) {
            if(!!data && !!data.shared_with_me && !!data.shared_with_me[username] && !!data.shared_with_me[username]['profile/email'] && !!data.shared_with_me[username]['keys/pwd/mine1']) {
                if(!!data.shared_with_me[username]['profile/recup_id']) {
                    complete(true, rsa_key, data);
                } else if(!!data.shared_with_me[username]['keys/pwd/mine2']) {
                    complete(false, rsa_key, data);
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
    function complete(pk, data) {
        try {
            whigi('GET', '/vault/' + data.shared_with_me[username]['profile/email']).then(function(vault) {
                var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                var email = decryptAES(vault.data_crypted_aes, aesKey);
                whigi('GET', '/vault/' + data.shared_with_me[username]['keys/pwd/mine1']).then(function(vault) {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, pk);
                    var mine1 = decryptAES(vault.data_crypted_aes, aesKey);
                    var mine2 = decodeURIComponent(req.params.half);
                    //Forge key for AES retrieval, AES and encrypt.
                    aesKey = utils.toBytes(utils.generateRandomString(64));
                    var retKey = utils.generateRandomString(20);
                    mapping[retKey] = utils.arr2str(aesKey);
                    var encrypt = decryptAES(mine1 + mine2, aesKey);
                    whigi('GET', '/user/' + username).then(function(remote) {
                        mailer.sendMail(utils.mailConfig(email, 'reset', req, {
                            username: username,
                            secret: encodeURIComponent(encrypt),
                            key: retKey
                        }, remote), function(e, i) {});
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
        } catch(e) {
            res.type('application/json').status(500).json({error: utils.i18n('internal.keys', req)});
        }
    }

    whigi('GET', '/profile').then(function(profile) {
        var rsa_key = fs.readFileSync(__dirname + '/../whigi/whigi-key.pem');
        whigi('GET', '/profile/data').then(function(data) {
            if(!!data && !!data.shared_with_me && !!data.shared_with_me[username] && !!data.shared_with_me[username]['profile/email'] && !!data.shared_with_me[username]['keys/pwd/mine1']) {
                complete(rsa_key, data);
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