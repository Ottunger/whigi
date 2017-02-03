/**
 * API dealing with getting ads.
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
var uaccount, db, profile, rsa_key;

class RawAd {
    _id: string
    lat: string;
    lon: string;
    radius : string;
    url: string;
    topics: {[ln: string]: string};
}

class Ad {
    _id: string;
    lat: number;
    lon: number;
    who: string;
    location: any;
    radius : number;
    url: string;
    topics: {[ln: string]: string[]};
}

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
 * @param {String} ua Account.
 * @param {Object} dbs Database.
 */
export function managerInit(ua: string, dbs: any) {
    uaccount = ua;
    db = dbs;
    function update() {
        whigi('POST', 'profile/data/discard', {discard: []}, true).then(function(data) {
            var sharers = Object.getOwnPropertyNames(data.shared_with_me);
            sharers.forEach(function(sharer) {
                var campaigns = Object.getOwnPropertyNames(data.shared_with_me[sharer]);
                campaigns.forEach(function(campaign) {
                    db.collection('campaigns').findOne({_id: campaign}, function(err, cmp) {
                        if(!!cmp)
                            return;
                        //Now we have to insert a new share!
                        decryptVault(data.shared_with_me[sharer][campaign]).then(function(vault) {
                            var cmp: RawAd = JSON.parse(vault.decr_data), when = vault.expire_epoch - (new Date).getTime();
                            if(when > 0) {
                                var ad: Ad = {
                                    _id: cmp._id,
                                    radius: parseFloat(cmp.radius),
                                    lat: parseFloat(cmp.lat),
                                    lon: parseFloat(cmp.lon),
                                    location: null,
                                    who: sharer,
                                    topics: {},
                                    url: /https?:\/\//.test(cmp.url)? cmp.url : 'https://' + utils.WHIGIHOST
                                };
                                //i18n messages
                                var lns = Object.getOwnPropertyNames(cmp.topics);
                                for(var i = 0; i < lns.length; i++) {
                                    ad.topics[lns[i]] = cmp.topics[lns[i]].split(',').map(function(el) {return el.trim().toLowerCase()}).filter(function(el) {return el.length > 3});
                                }
                                //We're nice, make a square
                                var tl = ad.lat - (ad.radius / 110.574), tr = ad.lat + (ad.radius / 110.574);
                                var bl = ad.lon - (ad.radius / (111.32*Math.cos(tl))), br = ad.lon + (ad.radius / (111.32*Math.cos(tl)));
                                ad.location = {type: 'Polygon', coordinates: [[
                                    [bl, tl],
                                    [br, tl],
                                    [br, tr],
                                    [bl, tr],
                                    [bl, tl]
                                ]]};
                                db.collection('campaigns').update({_id: ad._id}, ad, {upsert: true});
                                setTimeout(function() {
                                    db.collection('campaigns').remove({_id: ad._id});
                                }, when);
                            }
                        }, function(e) {/*Vault has probably expired*/});
                    }, function(e) {});
                });
            });
        }, function(e) {});
    }
    setTimeout(update, 90*60*1000);
    //Prepare profile then go
    whigi('GET', 'profile').then(function(user) {
        profile = user;
        try {
            var master_key = utils.getMK(hash.sha256(require('./password.json').pwd + user.salt), user);
            var decrypter = new aes.ModeOfOperation.ctr(master_key, new aes.Counter(0));
            rsa_key = aes.util.convertBytesToString(decrypter.decrypt(user.rsa_pri_key[0]));
        } catch(e) {}
        update();
    }, function(e) {});
}

/**
 * Sends a request to Whigi
 * @function whigi
 * @private
 * @param {String} method Method.
 * @param {String} path End point.
 * @param {Object} data Data.
 * @param {Boolean} puzzle Need puzzle.
 * @return {Promise} Promise.
 */
function whigi(method: string, path: string, data?: any, puzzle?: boolean): Promise {
    var puzstr = '';
    return new Promise(function(resolve, reject) {
        function complete() {
            var options = {
                host: utils.WHIGIHOST,
                port: 443,
                path: '/api/v1/' + path + puzstr,
                method: method,
                headers: {
                'Authorization': 'Basic ' + new Buffer(uaccount + ':' + hash.sha256(require('./password.json').pwd)).toString('base64')
                }
            };
            if(method == 'POST') {
                data = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(data);
            }
            var ht = https.request(options, function(res) {
                var r = '';
                res.on('data', function(chunk) {
                    r += chunk;
                });
                res.on('end', function() {
                    var ret = JSON.parse(r);
                    if('error' in ret)
                        reject(ret);
                    else
                        resolve(ret);
                });
            }).on('error', function(err) {
                reject(err);
            });
            if(method == 'POST')
                ht.write(data);
            ht.end();
        }
        //Puzzle?
        if(puzzle === true) {
            whigi('GET', 'data/haha/to/hihi?puzzle=0').then(function() {}, function(err) {
                puzstr = utils.regPuzzle(err.puzzle);
                complete();
            });
        } else {
            complete();
        }
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
 * Decrypt a vault and return its contents.
 * @function decryptVault
 * @private
 * @param {String} id Vault ID.
 * @return {Promise} Data.
 */
function decryptVault(id: string): Promise {
    return new Promise(function(resolve, reject) {
        whigi('GET', 'vault/' + id).then(function(vault) {
            try {
                var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, rsa_key);
                vault.decr_data = decryptAES(vault.data_crypted_aes, aesKey);
                resolve(vault);
            } catch(e) {
                reject(e);
            }
        }, function(e) {
            reject(e);
        });
    });
}

/**
 * Computes a distance.
 * @function distance
 * @param {Number} lat1 Latitude 1.
 * @param {Number} lon1 Longitude 1.
 * @param {Number} lat2 Latitude 2.
 * @param {Number} lon2 Longitude 2.
 * @param {String} unit K or M.
 * @return {Number} Value.
 */
function distance(lat1: number, lon1: number, lat2: number, lon2: number, unit: string): number {
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var theta = lon1 - lon2;
	var radtheta = Math.PI * theta/180;
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	if(unit == 'K')
        dist = dist * 1.609344;
	if(unit == 'N')
        dist = dist * 0.8684;
	return dist;
}

/**
 * Searches a campaign.
 * @function search
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function search(req, res) {
    var points: {lat: number, lon: number}[] = req.body.points;
    var terms = req.body.terms, lang: string = (req.body.lang || 'en' ).toString();
    if(!(points.constructor === Array)) {
        res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
        return;
    }
    if(!(terms.constructor === Array)) {
        res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
        return;
    }
    var query = {$and: [{$or: []}, {$or: []}]};
    for(var i = 0; i < points.length; i++) {
        if(!points[i].lat || !points[i].lon)
            continue;
        query.$and[0].$or.push({
            location: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [points[i].lon, points[i].lat]
                    }
                }
            }
        });
    }
    terms = terms.map(function(el) {return el.trim().toLowerCase();}).filter(function(el) {return el.length > 3});
    for(var i = 0; i < terms.length; i++) {
        var limitor = {}
        limitor['topics.' + lang] = terms[i];
        query.$and[1].$or.push(limitor);
    }
    db.collection('campaigns').find(query).toArray(function(err, docs: Ad[]) {
        docs = docs || [];
        function ns(a: any[], b: any[]): number {
            var n = 0;
            for(var i = 0; i < a.length; i++)
                if(b.indexOf(a[i]) != -1)
                    n++;
            return n;
        }
        docs.sort(function(a, b) {
            //If result is negtive, a is put before b.
            var scorea = a.radius / 60, scoreb = b.radius / 60;
            scorea += a.topics[lang].length + Math.log(Math.min(...points.map(function(pt) {return distance(pt.lat, pt.lon, a.lat, a.lon, 'K')})));
            scoreb += b.topics[lang].length + Math.log(Math.min(...points.map(function(pt) {return distance(pt.lat, pt.lon, b.lat, b.lon, 'K')})));;
            scorea -= 2*ns(terms, a.topics[lang]);
            scoreb -= 2*ns(terms, b.topics[lang]);
            return scoreb - scorea;
        });
        res.type('application/json').status(200).json(docs.map(function(doc: Ad) {
            return {
                who: doc.who,
                cid: doc._id,
                url: doc.url
            };    
        }));
    }, function(e) {
        res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
    });
}