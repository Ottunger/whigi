/**
 * API dealing with maintaining Whigi state.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var https = require('https');
var utils = require('../utils/utils');
var fupt = require('../common/cdnize/full-update_pb');
var known = {}, flags = {};

/**
 * Asks a Whigi to remove known data.
 * @function sendDelete
 * @private
 * @param {String} host Host.
 * @param {String} buf Serialized message.
 */
function sendDelete(host: string, buf: string) {
    var data = {
        payload: buf,
        key: require('../../common/key.json').key
    };
    var options = {
        host: host,
        port: 443,
        path: '/api/v1/any/remove',
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
            console.log('Ask for removal to ' + host + ' ended with answer "' + r + '"');
        });
    }).on('error', function(err) {
        console.log('Cannot ask for removal to ' + host);
    });
    ht.write(data);
    ht.end();
}

/**
 * Takes whole state from a whigi.
 * @function full
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function full(req, res) {
    var got = req.body;
    var ip = req.headers['x-forwarded-for'].split(', ')[0] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(got.key == require('../common/key.json').key && (!flags[ip] || Object.getOwnPropertyNames(flags[got.host][ip]).length < 2)) {
        known[ip] = {
            at: (new Date).getTime(),
            collections: {}
        };
        res.type('application/json').status(200).json({error: ''});

        var load = fupt.FullUpdate.deserializeBinary(got.payload);
        var coll = load.getMappingsList();
        for(var i = 0; i < coll.length; i++) {
            var name = coll[i].getName();
            known[ip].collections[name] = coll[i].getIdsList();
        }
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Takes some state from a Whigi.
 * @function requestMapping
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function partial(req, res) {
    var got = req.body;
    var ip = req.headers['x-forwarded-for'].split(', ')[0] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(got.key == require('../common/key.json').key && (!flags[ip] || Object.getOwnPropertyNames(flags[got.host][ip]).length < 2)) {
        known[ip] = known[ip] || {};
        known[ip].at = (new Date).getTime();
        res.type('application/json').status(200).json({error: ''});

        var load = fupt.FullUpdate.deserializeBinary(got.payload);
        var coll = load.getMappingsList();
        for(var i = 0; i < coll.length; i++) {
            var name = coll[i].getName();
            var del = coll[i].getDeletedList();
            known[ip].collections[name] = known[ip].collections[name] || [];
            known[ip].collections[name] = known[ip].collections[name].filter(function(el) {
                return del.indexOf(el) == -1;
            });
        }

        var ips = Object.getOwnPropertyNames(known);
        for(var i = 0; i < ips.length; i++) {
            if(known[ips[i]].at < (new Date).getTime() - 4*60*60*1000) {
                delete known[ips[i]];
            } else if(known[ips[i]].at < known[ip].at) {
                sendDelete(ips[i], req.payload);
            }
        }
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Answers who has some state.
 * @function question
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function question(req, res) {
    var got = req.body;
    if(got.key == require('../common/key.json').key) {
        var ret = {points: {}}, ips = Object.getOwnPropertyNames(known);
        for(var i = 0; i < ips.length; i++) {
            if(known[ips[i]].at < (new Date).getTime() - 4*60*60*1000) {
                delete known[ips[i]];
            } else {
                if(!!known[ips[i]].collections[got.collection] && known[ips[i]].collections[got.collection].indexOf(got.id) > -1) {
                    ret.points[ips[i]] = true;
                }
            }
        }
        res.type('application/json').status(200).json(ret);
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}

/**
 * Flag a host as corrupted.
 * @function flag
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function flag(req, res) {
    var got = req.body;
    var ip = req.headers['x-forwarded-for'].split(', ')[0] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(got.key == require('../common/key.json').key && ip in known) {
        flags[got.host] = flags[got.host] || {date: 0};
        if(flags[got.host].date < (new Date).getTime() - 2*60*60*1000)
            flags[got.host][ip] = true;
        if(Object.getOwnPropertyNames(flags[got.host][ip]).length >= 2) {
            known[got.host] = {};
        }
        res.type('application/json').status(200).json({error: ''});
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}