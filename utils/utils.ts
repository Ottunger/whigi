/**
 * API to have utilities.
 * @module utils
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var querystring = require('querystring');
var https = require('https');
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
 * Sends a mail on behalf of the machine.
 * @function sendMail
 * @public
 * @param {Object} options The options and subject.
 * @param {Function} callback Function to be called with a boolean indicating an error.
 */
export function sendMail(options: any, callback: Function) {
    var spawn = require('child_process').spawn;
    var mail = 'MIME-Version: 1.0\n' +
        'X-Mailer: Whigi\n' +
        'Date: ' + new Date().toUTCString() + '\n' +
        'Message-Id: <' + generateRandomString(16) + '@Whigi>\n' +
        'From: ' + options.from + '\n' +
        'To: ' + options.to + '\n' +
        'Subject: ' + options.subject + '\n' +
        'Content-Type: text/html; charset=utf-8\n' +
        'Content-Transfer-Encoding: quoted-printable\n\n' +
        options.html;

    var sendmail = spawn('sudo', ['sendmail', '-i', '-f', options.from, options.to]);

    sendmail.stdout.pipe(process.stdout);
    sendmail.stderr.pipe(process.stderr);

    sendmail.on('exit', function(code){
        callback(code != 0)
    });

    sendmail.stdin.write(mail);
    sendmail.stdin.end();
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

/**
 * Ask Whigi to create a token on behalf of Whigi-restore.
 * @function persistToken
 * @public
 * @param {String} newid The token.
 * @param {String} bearer_id Bearer id.
 * @return {Promise} Promise that resolves when Whigi has saved the token.
 */
export function persistToken(newid: string, bearer_id: string): Promise {
    var data = {
        token_id: newid,
        bearer_id: bearer_id,
        key: require('../common/key.json').key
    };
    var options = {
        host: WHIGIHOST,
        port: 443,
        path: '/api/v1/new',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
    };
    return new Promise(function(resolve, reject) {
        var ht = https.request(options, function(res) {
            var r = '';
            res.on('data', function(chunk) {
                r += chunk;
            });
            res.on('end', function() {
                resolve();
            });
        }).on('error', function(err) {
            reject(err);
        });
        ht.write(data);
        ht.end();
    });
}