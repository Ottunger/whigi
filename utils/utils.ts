/**
 * API to have utilities.
 * @module utils
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var querystring = require('querystring');
var https = require('https');
var RSA = require('node-rsa');
var constants = require('constants');
var strings = {
    en: require('./i18n/en.json'),
    fr: require('./i18n/fr.json')
}
export var WHIGIHOST = '';
export var RESTOREHOST = '';
export var RUNNING_ADDR = '';
export var MAIL_ADDR = '';
export var DEBUG = true;

/**
 * Returns the decoded version of a string incoded as binary base64.
 * @function atob
 * @private
 * @param {String} str Encoded string.
 * @return {String} Decoded string.
 */
export function atob(str: string): string {
    return new Buffer(str, 'base64').toString('binary');
}

/**
 * Returns the encoded version of a string as binary base64.
 * @function btoa
 * @private
 * @param {String} str Decoded string.
 * @return {String} Encoded string.
 */
export function btoa(str: string): string {
    return new Buffer(str).toString('base64');
}

/**
 * Generates a random string.
 * @function generateRandomString
 * @public
 * @param {Number} length The length.
 * @return {String} The string.
 */
export function generateRandomString(length: number): string {
    var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var randomString = '';
    for (var i = 0; i < length; i++) {
        randomString += characters[Math.floor(Math.random() * characters.length)];
    }
    return randomString;
}

/**
 * Array forEach with callback if asynchronous.
 * @function loopOn
 * @public
 * @param {Array} array The array.
 * @param {Function} apply The function to apply to each element.
 * @param {Function} callin A function that runs as a callback to each asynchrnous "apply" call.
 * @param {Function} callback Global callback.
 */
export function loopOn(array: any[], apply: Function, callin: Function, callback: Function) {
    var ct = 0;
    array.forEach(function(item, i) {
        apply(item, function(a, b, c) {
            callin(item, a, b, c);
            ct++;
            if(ct == array.length)
                callback();
        });
    });
}

/**
 * Tries to translate a string into the given language.
 * @function i18n
 * @public
 * @param {String} str The string to translate.
 * @param {Request} req The language as a IANA code.
 * @return {String} The translated string or itself if no match.
 */
export function i18n(str: string, req: any) {
    var lang = req.get('Accept-Language');
    if(lang == undefined)
        lang = 'en';
    else {
        lang = lang.trim().substring(0, 2);
        if(!(lang in strings))
            lang = 'en';
    }
    
    if(str in strings[lang])
        return strings[lang][str];
    return str;
}

/**
 * Return an array from the first values of a string giving an AES key.
 * @function toBytes
 * @private
 * @param {String} data String.
 * @return {Bytes} Bytes.
 */
export function toBytes(data: string): number[] {
    function num(e) {
        if(e >= 65)
            return e - 55;
        else
            return e - 48;
    }

    var ret: number[] = [];
    try {
        for(var i = 0; i < 32; i++) {
            ret.push((num(data.charCodeAt(2*i)) * 16 + num(data.charCodeAt(2*i + 1))) % 256);
        }
    } catch(e) {
        return ret;
    }
    return ret;
}

/**
 * Turns an array of nums to a string.
 * @function arr2str
 * @public
 * @param {Number[]} arr Array.
 * @return {String} String.
 */
export function arr2str(arr: number[]): string {
    var result = '';
    for (var i = 0; i < arr.length; i++) {
        result += String.fromCharCode(arr[i]);
    }
    return result;
}

/**
 * Turns a string to an array of numbers.
 * @function str2arr
 * @public
 * @param {String} str String.
 * @return {Number[]} Array.
 */
export function str2arr(str: string): number[] {
    var result: number[] = [];
    for (var i = 0; i < str.length; i++) {
        result.push(parseInt(str.charCodeAt(i).toString(10)));
    }
    return result;
}

/**
 * Unpads for PKCS1type2
 * @function pkcs1unpad2
 * @public
 * @param {Number[]} b Data.
 * @param {Number} k Number of bits in key.
 * @return {Number[]} Unpadded.
 */
export function pkcs1unpad2(b: number[], k: number): number[] {
    var i = 0;
    var n = (k + 7) >> 3;
    while(i < b.length && b[i] == 0)
        ++i;
    if(b[i] != 2)
        return null;
    ++i;
    while(b[i] != 0)
        if(++i >= b.length)
            return null;
    var ret = '';
    while(++i < b.length) {
        var c = b[i] & 255;
        if(c < 128) {
            ret += String.fromCharCode(c);
        } else if((c > 191) && (c < 224)) {
            ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
            ++i;
        } else {
            ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
            i += 2;
        }
    }
    return str2arr(ret);
}

/**
 * Pads for PKCS1type2
 * @function pkcs1pad2
 * @public
 * @param {Number[]} b Data.
 * @param {Number} k Number of bits in key.
 * @return {Number[]} Padded.
 */
export function pkcs1pad2(s: number[], k: number): number[] {
    var n = (k + 7) >> 3;
    if(n < s.length + 11) {
        return null;
    }
    var ba = new Array(n);
    var i = s.length - 1;
    while(i >= 0 && n > 0) {
        var c = s[i--];
        if(c < 128) {
            ba[--n] = c;
        } else {
            ba[--n] = (c & 63) | 128;
            ba[--n] = (c >> 6) | 192;
        }
    }
    ba[--n] = 0;
    while(n > 2) {
        ba[--n] = 0;
        while(ba[n] == 0)
            ba[n] = Math.floor(Math.random() * 254 + 1);
    }
    ba[--n] = 2;
    ba[--n] = 0;
    return ba;
}

/**
 * Decrypt an AES key using RSA.
 * @function decryptRSA
 * @public
 * @param {String} Encrypted data.
 * @param {String} rsa_key Key.
 * @return {Number[]} Decrypted data, we use AES keys.
 */
export function decryptRSA(data: string, rsa_key: string): number[] {
    var dec = new RSA(
        rsa_key, 'pkcs1-private-pem', {
            encryptionScheme: {
                scheme: 'pkcs1',
                padding: constants.RSA_NO_PADDING
            }
        }
    );
    var arr = dec.decrypt(data);
    return pkcs1unpad2(arr, 1024);
}

/**
 * Encrypt an AES key using RSA.
 * @function encryptRSA
 * @public
 * @param {Number[]} Decrypted data.
 * @param {String} rsa_key Key.
 * @return {Number[]} Encrypted data, we use AES keys.
 */
export function encryptRSA(data: number[], rsa_key: string): number[] {
    var dec = new RSA(
        rsa_key, 'pkcs8-public', {
            encryptionScheme: {
                scheme: 'pkcs1',
                //padding: constants.RSA_NO_PADDING
            }
        }
    );
    //var arr = pkcs1pad2(data, 1024);
    var arr = data
    return dec.encrypt(arr);
}

/**
 * Checks the captcha and returns whether ko or not to callback.
 * @function checkCaptcha
 * @public
 * @param {String} c Challenge.
 * @param {Function} callback Callback.
 */
export function checkCaptcha(c: string, callback: Function) {
    var data = querystring.stringify({
        secret: '6LfleigTAAAAAG_-AGX7NOMgfchlIbzuBtdD5qmw',
        response: c
    });
    var options = {
        host: 'www.google.com',
        port: 443,
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data)
        }
    };
    var ht = https.request(options, function(res) {
        var r = '';
        res.on('data', function(chunk) {
            r += chunk;
        });
        res.on('end', function() {
            var obj = JSON.parse(r);
            if('success' in obj && obj.success == true)
                callback(true);
            else
                callback(false);
        });
    }).on('error', function(err) {
        callback(false);
    });
    ht.write(data);
    ht.end();
}

/**
 * Calls Whigi-restore to create a new mapping.
 * @function registerMapping
 * @public
 * @param {String} id Id.
 * @param {String} email Email.
 * @param {String} master_key Master key.
 * @param {Boolean} safe Whether to use recup_mail.
 * @param {String} recup_mail Recup mail to use.
 * @param {String} recup_mail2 Other email.
 * @param {Function} callback Callback will be called with true if error occured.
 */
export function registerMapping(id: string, email: string, master_key: string, safe: boolean, recup_mail: string, recup_mail2: string, callback) {
    var data = {
        id: id,
        email: email,
        master_key: master_key,
        safe: safe,
        recup_mail: recup_mail,
        recup_mail2: recup_mail2,
        key: require('../common/key.json').key
    };
    var options = {
        host: RESTOREHOST,
        port: 443,
        path: '/api/v1/new',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
    };
    var ht = https.request(options, function(res) {
        var r = '';
        res.on('data', function(chunk) {
            r += chunk;
        });
        res.on('end', function() {
            callback(false);
        });
    }).on('error', function(err) {
        callback(true);
    });
    ht.write(data);
    ht.end();
}
