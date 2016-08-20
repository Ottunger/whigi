/**
 * API to have utilities.
 * @module utils
 * @author Mathonet Grégoire
 */

'use strict';
var hash = require('js-sha256').sha256;
var querystring = require('querystring');
var https = require('https');
var strings = {
    en: require('./i18n/en.json'),
    fr: require('./i18n/fr.json')
}

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
exports.generateRandomString = function (length) {
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
exports.loopOn = function(array, apply, callin, callback) {
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
exports.sendMail = function(options, callback) {
    var spawn = require('child_process').spawn;
    var mail = 'MIME-Version: 1.0\n' +
        'X-Mailer: Whigi\n' +
        'Date: ' + new Date().toUTCString() + '\n' +
        'Message-Id: <' + exports.generateRandomString(16) + '@Whigi>\n' +
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
exports.i18n = function(str, req) {
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
 * Verifies that the client has generated an OK solution. Anyways, generate a new challenge.
 * @function checkPuzzle
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Function} next Handler middleware.
 */
exports.checkPuzzle = function(req, res, next) {
    if(!('puzzle' in req.query)) {
        req.user.puzzle = exports.generateRandomString(16);
        req.user.persist();
        res.type('application/json').status(412).json({error: exports.i18n('client.puzzle', req), puzzle: req.user.puzzle});
    } else {
        var complete = hash.sha256(req.user.puzzle + req.query.puzzle);
        if(complete.charAt(0) == '0' && complete.charAt(1) == '0' && complete.charAt(2) == '0' && complete.charAt(3) == '0') {
            req.user.puzzle = exports.generateRandomString(16);
            next();
        } else {
            req.user.puzzle = exports.generateRandomString(16);
            req.user.persist();
            res.type('application/json').status(412).json({error: exports.i18n('client.puzzle', req), puzzle: req.user.puzzle});
        }
    }
}

/**
 * Checks the captcha and returns whether ko or not to callback.
 * @function checkCaptcha
 * @public
 * @param {String} c Challenge.
 * @param {Function} callback Callback.
 */
exports.checkCaptcha = function(c, callback) {
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