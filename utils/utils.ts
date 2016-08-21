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
export var RUNNING_ADDR = '';

/**
 * Returns the decoded version of a string incoded as binary base64.
 * @function atob
 * @private
 * @param {String} str Encoded string.
 * @return {String} Decoded string.
 */
function atob(str) {
    return new Buffer(str, 'base64').toString('binary');
}

/**
 * Generates a random string.
 * @function generateRandomString
 * @public
 * @param {Number} length The length.
 * @return {String} The string.
 */
export function generateRandomString(length) {
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
export function loopOn(array, apply, callin, callback) {
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
export function sendMail(options, callback) {
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
export function i18n(str, req) {
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
 * Checks the captcha and returns whether ko or not to callback.
 * @function checkCaptcha
 * @public
 * @param {String} c Challenge.
 * @param {Function} callback Callback.
 */
export function checkCaptcha(c, callback) {
    var data = querystring.stringify({
        secret: '6Leh9xkTAAAAADWHU8UCfIER8ztoD6tyreGNJYM4',
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
 * @param {String} email Email.
 * @param {String} master_key Master key.
 * @param {Function} callback Callback will be called with true if error occured.
 */
export function registerMapping(email, master_key, callback) {
    var data = querystring.stringify({
        email: email,
        master_key: master_key,
        key: require('../common/key.json').key
    });
    var options = {
        host: 'www.google.com',
        port: 443,
        path: '/api/v1/new',
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
            callback(false);
        });
    }).on('error', function(err) {
        callback(true);
    });
    ht.write(data);
    ht.end();
}