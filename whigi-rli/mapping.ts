/**
 * API dealing with maintaining Whigi state.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var https = require('https');
var amqp = require('amqplib/callback_api');
var zip = require('compressjs').Lzp3;
var utils = require('../utils/utils');
var fupt = require('../common/cdnize/full-update_pb');
var RMQD: any[];
var known = {}, flags = {};

/**
 * Asks a Whigi to remove known data.
 * @function sendDelete
 * @private
 * @param {String} host Host.
 * @param {String} buf Serialized message.
 */
function sendDelete(host: string, buf: number[]) {
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
            console.log('[' + utils.RUNNING_ADDR + '] Ask for removal to ' + host + ' ended with answer "' + r + '"');
        });
    }).on('error', function(err) {
        console.log('[' + utils.RUNNING_ADDR + '] Cannot ask for removal to ' + host);
    });
    ht.write(data);
    ht.end();
}

/**
 * Takes whole state from a whigi.
 * @function full
 * @public
 * @param {Object} msg The message.
 */
function full(msg: any) {
    var load = fupt.FullUpdate.deserializeBinary(zip.decompressFile(new Uint8Array(msg.content)));
    var ip = load.getFromer();
    console.log('[' + utils.RUNNING_ADDR + '] Received update from ' + ip + '.');
    known[ip] = {
        at: (new Date).getTime(),
        collections: {}
    };
    
    var coll = load.getMappingsList();
    for(var i = 0; i < coll.length; i++) {
        var name = coll[i].getName();
        known[ip].collections[name] = coll[i].getIdsList();
    }
}

/**
 * Takes some state from a Whigi.
 * @function partial
 * @public
 * @param {Object} msg The message.
 */
function partial(msg: any) {
    var load = fupt.FullUpdate.deserializeBinary(zip.decompressFile(new Uint8Array(msg.content)));
    var ip = load.getFromer();
    console.log('[' + utils.RUNNING_ADDR + '] Received update from ' + ip + '.');
    known[ip] = known[ip] || {};
    known[ip].at = (new Date).getTime();

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
            sendDelete(ips[i], msg);
        }
    }
}

/**
 * Sets up the schedule before use.
 * @function managerInit
 * @public
 */
export function managerInit() {
    var ep = require(utils.ENDPOINTS);
    amqp.connect('amqp://' + ep.rabbithost, function(err, conn) {
        if(err) {
            console.log('Cannot use RabbitMQ message broker. Standalone instance.');
            return;
        }
        conn.createChannel(function(err, ch) {
            ch.assertExchange(ep.rabbitexc, 'fanout', {durable: true});
            ch.assertQueue('', {exclusive: true}, function(err, q) {
                if(err) {
                    console.log('Cannot use RabbitMQ message broker. Standalone instance.');
                    return;
                }
                ch.bindQueue(q.queue, ep.rabbitexc, 'update');
                ch.consume(q.queue, partial);
            });
            ch.assertQueue('', {exclusive: true}, function(err, q) {
                if(err) {
                    console.log('Cannot use RabbitMQ message broker. Standalone instance.');
                    return;
                }
                ch.bindQueue(q.queue, ep.rabbitexc, 'full');
                ch.consume(q.queue, full);
            });
        });
    });
}

/**
 * Close RMQ.
 * @function close
 * @public
 */
export function close() {
    if(!!RMQD) {
        RMQD[0].close();
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
    var ip = !!req.headers['x-forwarded-for']? req.headers['x-forwarded-for'].split(', ')[0] : req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(got.key == require('../common/key.json').key && ip in known) {
        flags[got.host] = flags[got.host] || {date: 0};
        if(flags[got.host].date < (new Date).getTime() - 2*60*60*1000)
            flags[got.host][ip] = true;
        if(Object.getOwnPropertyNames(flags[got.host]).length >= 2) {
            known[got.host] = {};
        }
        res.type('application/json').status(200).json({error: ''});
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}