/**
 * API dealing with giveways, lauching a new WP.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var https = require('https');
var hash = require('js-sha256');
var aes = require('aes-js');
var RSA = require('node-rsa');
var utils = require('../utils/utils');
var mailer, db, rsa_key;

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
    rsa_key = '';
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
          'Authorization': 'Basic ' + new Buffer('whigi-restore:' + hash.sha256(require('./password.json').pwd)).toString('base64')
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
 * Decrypt a vault and return its contents.
 * @function decryptVault
 * @private
 * @param {Object} profile My profile.
 * @param {String} user User id.
 * @param {String} name Name.
 * @return {Promise} Data.
 */
function decryptVault(profile: any, user: string, name: string): Promise {
    return new Promise(function(resolve, reject) {
        if(!!profile.shared_with_me[user] && !!profile.shared_with_me[user][name]) {
            whigi('GET', '/api/v1/vault/' + profile.shared_with_me[user][name]).then(function(vault) {
                var aesKey: number[] = decryptRSA(vault.aes_crypted_shared_pub, rsa_key);
                vault.decr_data = decryptAES(vault.encr_data, aesKey);
                resolve(vault);
            }, function(e) {
                reject(e);
            });
        } else {
            reject('Not shared');
        }
    });
}

/**
 * Creates a new mapping if not one already.
 * @function create
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function create(req, res) {
    var response: string = req.query.response;
    var id: string = req.query.user;
    var challenge: string = req.query.challenge;
    
    whigi('GET', '/api/v1/profile').then(function(user) {
        if(rsa_key == '') {
            var key = utils.toBytes(hash.sha256(require('./password.json').pwd + user.salt));
            var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
            var master_key = decrypter.decrypt(user.encr_master_key);
            decrypter = new aes.ModeOfOperation.ctr(master_key, new aes.Counter(0));
            rsa_key = aes.util.convertBytesToString(decrypter.decrypt(user.rsa_pri_key));
        }

        whigi('GET', '/api/v1/profile/data').then(function(data) {
            user.data = data.data;
            user.shared_with_me = data.shared_with_me;

            decryptVault(user, id, 'keys/auth/whigi-giveaway').then(function(vault) {
                if(decryptAES(atob(response), utils.toBytes(vault.decr_data)) == challenge) {

                } else {
                    res.redirect('/error.html');
                }
            }, function(e) {
                res.redirect('/error.html');
            });
        }, function(e) {
            res.redirect('/error.html');
        });
    }, function(e) {
        res.redirect('/error.html');
    });
}