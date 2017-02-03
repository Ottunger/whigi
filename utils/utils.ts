/**
 * API to have utilities.
 * @module utils
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
var https = require('https');
var aes = require('aes-js');
var RSA = require('node-rsa');
var hash = require('js-sha256');
var pki = require('node-forge').pki;
var constants = require('constants');
var mc = require('./mails/config.json');
export var strings = {
    en: require('./i18n/en.json'),
    fr: require('./i18n/fr.json')
};
export var WHIGIHOST = '';
export var RESTOREHOST = '';
export var RUNNING_ADDR = '';
export var MAIL_ADDR = '';
export var ENDPOINTS = '';
export var DEBUG = true;
export var DEBUG_PPL = true;

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
 * @param {Boolean} l Only letters.
 * @return {String} The string.
 */
export function generateRandomString(length: number, l?: boolean): string {
    var characters = (l !== false)? 'abcdefghijklmnopqrstuvwxyz' : '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var randomString = '';
    for (var i = 0; i < length; i++) {
        randomString += characters[Math.floor(Math.random() * characters.length)];
    }
    return randomString;
}

/**
 * Generates a random ID.
 * @function genID
 * @public
 * @param {String} prefixes Forbidden prefixes.
 * @param {String} prefix A prefix
 * @return {String} The string.
 */
export function genID(prefixes: string[], prefix: string = ''): string {
    var more = 128 - prefix.length, newid = prefixes[0], can = false;
    if(more == 128) {
        while(!can) {
            can = true;
            for(var i = 0; i < prefixes.length; i++) {
                if(newid.indexOf(prefixes[i]) == 0) {
                    newid = generateRandomString(128);
                    can = false;
                    break;
                }
            }
        }
        return newid;
    } else
        return prefix + generateRandomString(more);
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
 * Solves the server puzzle, then return a string for it.
 * @function regPuzzle
 * @private
 * @param {String} puzzle Challenge.
 * @return {String} Puzzle solution.
 */
export function regPuzzle(puzzle: string): string {
    var i = 0, complete;
    do {
        complete = hash.sha256(puzzle + i);
        i++;
    } while(complete.charAt(0) != '0' || complete.charAt(1) != '0' || complete.charAt(2) != '0');
    return '?puzzle=' + (i - 1);
}

/**
 * Tries to translate a string into the given language.
 * @function i18n
 * @public
 * @param {String} str The string to translate.
 * @param {Request} req The language as a IANA code.
 * @param {User} userin A user object whose lang should be used rather than ours.
 * @param {Object} more Dictionary to prefer to use before fallback dictionary.
 * @return {String} The translated string or itself if no match.
 */
export function i18n(str: string, req: any, userin?: any, more?: {[id: string]: {[id: string]: string}}) {
    userin = userin || req.user;
    var lang = (!!userin && !!userin.company_info)? userin.company_info.lang : undefined;
    if(lang == undefined && !!req.get)
        lang = req.get('Accept-Language');
    if(lang == undefined)
        lang = 'en';
    else {
        lang = lang.trim().substring(0, 2);
        if(!(lang in strings))
            lang = 'en';
    }
    
    if(!!more && !!more[lang] && !!more[lang][str])
        return more[lang][str];
    else if(str in strings[lang])
        return strings[lang][str];
    return str;
}

/**
 * Create a mail.
 * @function mailConfig
 * @public
 * @param {String} to To.
 * @param {String} subject One of Whigi topics.
 * @param {Request} req For i18n.
 * @param {Object} context More context.
 * @param {User} userin For i18n.
 * @param {Boolean} notwhigi Prevent check of template.
 * @param {String} from Then, a from name.
 * @param {String} template A template file path.
 * @return {Object} Mail config.
 */
export function mailConfig(to: string, subject: string, req: any, context?: {[id: string]: any}, userin?: any,
    notwhigi?: boolean, from?: string, template?: string): any {
    //Sanity check first
    if(notwhigi !== true && mc.vendorTemplates.indexOf(subject) == -1 && mc.templates.indexOf(subject) == -1)
        return {};
    try{
        context = Object.assign({
            myURL: RUNNING_ADDR
        }, context || {});
        var ret = {
            from: ((notwhigi === true && !!from)? from : 'WiSSL') + ' <' + MAIL_ADDR + '>',
            to: '<' + to + '>',
            subject: i18n((notwhigi === true)? subject : mc[subject + 'Subject'], req, userin, context['i18n'])
        };
        
        ret['html'] = parser(!!template? template : path.join(__dirname, 'mails/' + mc[subject + 'HTML']), req, context, userin);
        return ret;
    } catch(e) {
        return {};
    }
}

/**
 * Parses a template.
 * @function parser
 * @public
 * @param {String} file File to load.
 * @param {Request} req For i18n.
 * @param {Object} context More context.
 * @param {User} userin For i18n.
 * @return {Object} Mail config.
 */
export function parser(file: string, req: any, context?: {[id: string]: any}, userin?: any): string {
    var template: string = fs.readFileSync(file, 'utf8'), parsed = template;
    var rgx = /{{ ?([^}]*) ?}}/g;
    var match = rgx.exec(template);
    var shift = 0, by;
    while(match != null) {
        match[1] = match[1].trim();
        if(/^['"].*['"]$/.test(match[1]))
            by = i18n(match[1].substr(1, match[1].length - 2), req, userin, context['i18n']);
        else
            by = context[match[1]] || '???';
        parsed = parsed.substr(0, match.index + shift) + by + parsed.substr(match.index + match[0].length + shift);
        shift += by.length - match[0].length;
        match = rgx.exec(template);
    }
    return parsed;
}

/**
 * Finds the master key from a profile.
 * @function getMK
 * @param {String} ks Initial key decryption to test.
 * @param {User} profile User profile.
 * @return {Number[]} Master key.
 */
export function getMK(kd: string, profile: any): number[] {
    var master_key: number[];
    for(var i = 0; hash.sha256(hash.sha256(arr2str(master_key || []) || '')) != profile.sha_master; i++) {
        var key = toBytes(kd);
        var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
        master_key = Array.from(decrypter.decrypt(profile.encr_master_key));
        kd = hash.sha256(kd);
        if(i == 1) {
            //We set to 1 or far more...
            for(var j = 0; j < 600; j++)
                kd = hash.sha256(kd);
        }
    }
    return master_key;
}

/**
 * Binds a function to be called if we can retrieve a user's mail.
 * @function mailUser
 * @public
 * @param {String} sharee User's id.
 * @param {Datasource} db Database.
 * @param {Function} callback Called only if we are OK.
 * @param {Function} err Called if not OK.
 */
export function mailUser(sharee: string, db: any, callback: Function, err?: Function) {
    db.retrieveUser('whigi-wissl', true, [sharee]).then(function(owned) {
        db.retrieveVault(owned.shared_with_me[sharee]['profile/email']).then(function(va) {
            var rsa_key = fs.readFileSync(__dirname + '/../whigi/whigi-key.pem');
            var aesKey: number[] = decryptRSA(va.aes_crypted_shared_pub, rsa_key);
            //Have to check for bound vaults...
            if(va.data_crypted_aes.indexOf('datafragment') == 0) {
                db.retrieveData(va.data_crypted_aes).then(function(d) {
                    callback(aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(0)).decrypt(str2arr(d.encr_data))), owned);
                }, function(e) {
                    if(!!err) err();
                });
            } else {
                callback(aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(aesKey, new aes.Counter(0)).decrypt(str2arr(va.data_cryped_aes))), owned);
            }
        }, function(e) {
            if(!!err) err();
        });
    }, function(e) {
        if(!!err) err();
    });
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
    if(arr.constructor !== Array)
        arr = Array.from(arr);
    var tmp = pkcs1unpad2(arr, 1024);
    var ret = tmp.slice(64);
    if(hash.sha256(arr2str(ret)) != arr2str(tmp.slice(0, 64))) {
        throw 'Cannot verify hash';
    }
    return ret;
}

/**
 * Encrypt an AES key using RSA.
 * @function encryptRSA
 * @public
 * @param {Number[]} Decrypted data.
 * @param {String} rsa_key Key.
 * @return {String} Encrypted data, we use AES keys.
 */
export function encryptRSA(data: number[], rsa_key: string): string {
    var dec = new RSA(
        rsa_key, 'pkcs8-public', {
            encryptionScheme: {
                scheme: 'pkcs1',
                padding: constants.RSA_NO_PADDING
            }
        }
    );
    var part = arr2str(data);
    data = str2arr(hash.sha256(part) + part);
    var arr = pkcs1pad2(data, 1024);
    return dec.encrypt(new Buffer(arr), 'base64');
}

/**
 * Triggers a vault trigger with no feedback.
 * @function lameTrigger
 * @public
 * @param {Datasource} db Database abstraction.
 * @param {User} user Requesting user.
 * @param {String} id Vault ID.
 * @param {Boolean} save Whether to save the user.
 */
export function lameTrigger(db: any, user: any, id: string, save: boolean) {
    db.retrieveVault(id).then(function(v) {
        if(v.expire_epoch > 0 && (new Date).getTime() > v.expire_epoch) {
            db.retrieveUser(v.shared_to_id, true).then(function(u) {
                delete u.shared_with_me[v.sharer_id][v.data_name];
                u.persist();
            });
            if(save) {
                delete user.data[v.real_name].shared_to[v.shared_to_id];
                user.persist();
                v.unlink();
            }
        } else if(!!v.trigger) {
            try {
                var pt = v.trigger.split('/', 2);
                var ht = https.request({
                    host: pt[0],
                    path: pt[1] + (pt[1].indexOf('?') == -1)? '?' : '&' + 'username=' + v.shared_to_id + '&vault=' + encodeURIComponent(v.data_name),
                    port: 443,
                    method: 'GET'
                }, function(res) {
                    var r = '';
                    res.on('data', function(chunk) {
                        r += chunk;
                    });
                    res.on('end', function() {});
                }).on('error', function(err) {});
                ht.end();
            } catch(e) {}
        }
    });
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
 * Calls PayPal to get an access token.
 * @function paypalToken
 * @public
 * @param {Function} callback Callback will be called undefined or token.
 */
export function paypalToken(callback: Function) {
    var options = {
        host: DEBUG_PPL? 'api.sandbox.paypal.com' : 'api.paypal.com',
        port: 443,
        path: '/v1/oauth2/token',
        method: 'POST',
        headers: {}
    };
    var data = querystring.stringify({grant_type: 'client_credentials'});
    options.headers['Authorization'] = 'Basic ' + new Buffer(DEBUG_PPL?
        'Ab1nQtpjUsjHLacxp12lcTHwJte7Eo4mu90KnGskaqeV3dSdJuaVKNtulPH0bVvvNYmggghGmW4qkjUB:EHDQFX7diKML4pMUZpdMt4-YXpC6hZSfoe885hqW4nV7VFvX1jGZqtBqwTkSnv99J3IyF0YKTPsOMk4U' :
        'AZRFFe5p-BPGJAOumTbKn236C4TXj0soTWJutS1uhqAZiQpfI-jF2GGgE4-l8l-o4-QPkQGls3g0AfJr:EDlHrMZgtMStgC-MBn8x7ZcuHbzFG37SGiFSuklb_zu8Cp5uEzBqZ58nHbZZ5rJBJNFGkBamcZzOf0kT').toString('base64');
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Accept'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(data);
    var ht = https.request(options, function(result) {
        var r = '';
        result.on('data', function(chunk) {
            r += chunk;
        });
        result.on('end', function() {
            var got = JSON.parse(r);
            callback(got.access_token);
        });
    }).on('error', function(err) {
        callback();
    });
    ht.write(data);
    ht.end();
}

/**
 * Returns a certificate.
 * @function whigiCert
 * @public
 * @param {String} pubPem Public PEM.
 * @param {String} priPemLoc Private PEM location.
 * @param {Object} params Remote params.
 * @return {String} Certificate PEM.
 */
export function whigiCert(pubPem: string, priPemLoc: string, params: any): string {
    var cert = pki.createCertificate();
    cert.publicKey = pki.publicKeyFromPem(pubPem);
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 100);
    var localAttrs = [
        {
            name: 'commonName',
            value: 'wissl.org'
        }, {
            name: 'countryName',
            value: 'BE'
        }, {
            shortName: 'ST',
            value: 'Hainaut'
        }, {
            name: 'localityName',
            value: 'Lodelinsart'
        }, {
            name: 'organizationName',
            value: 'WiSSL'
        }
    ], remoteAttrs = [
        {
            name: 'commonName',
            value: params.commonName
        }, {
            name: 'countryName',
            value: params.countryName
        }, {
            name: 'localityName',
            value: params.localityName
        }, {
            name: 'organizationName',
            value: params.organizationName
        }
    ];
    cert.setSubject(remoteAttrs);
    cert.setIssuer(localAttrs);
    cert.setExtensions([
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: false,
            keyEncipherment: true,
            dataEncipherment: true
        }, {
            name: 'extKeyUsage',
            serverAuth: true,
            clientAuth: true,
            codeSigning: true,
            emailProtection: true,
            timeStamping: true
        }, {
            name: 'nsCertType',
            client: true,
            server: false,
            email: true,
            objsign: true,
            sslCA: false,
            emailCA: false,
            objCA: false
        }
    ]);
    cert.sign(pki.privateKeyFromPem(fs.readFileSync(priPemLoc)));
    return pki.certificateToPem(cert);
}
