/**
 * API dealing with maintaining Whigi state.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var https = require('https');
var scd = require('node-schedule');
var amqp = require('amqplib/callback_api');
var zip = require('compressjs').Lzp3;
var utils = require('../utils/utils');
var fupt = require('../common/cdnize/full-update_pb');
var RMQUp: any[];
var known: {[id: string]: {upd: number, contacts: string[], empty: boolean}} = {}, flags = {};

/**
 * Asks another CC recursively.
 * @function recQuestion
 * @private
 * @param {String} domain A domain.
 * @param {String} coll Collection required.
 * @param {String} id ID required.
 * @return {Promise} On resolve, whether found or not.
 */
function recQuestion(domain: string, coll: string, id: string): Promise {
    var data = {
        collection: coll,
        id: id,
        key: require('../../common/key.json').key
    };
    var options = {
        host: domain.indexOf('domain') == 0? domain.replace(/^domain/, '') : domain,
        port: 443,
        path: '/question',
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
                if(res.statusCode != 200) {
                    reject();
                } else {
                    resolve(JSON.parse(r).points);
                }
            });
        }).on('error', function(err) {
            reject();
        });
        ht.write(data);
        ht.end();
    });
}

/**
 * Updates the root recursively.
 * @function recUpdate
 * @private
 */
function recUpdate() {
    var msg = new fupt.FullUpdate();
    msg.setFromer(utils.RUNNING_ADDR);

    var mappings = [], seen = {}, keys = Object.getOwnPropertyNames(known);
    for(var i = 0; i < Math.min(100, keys.length); i++) {
        var index = Math.floor(Math.random() * Math.min(100, keys.length));
        var coll = keys[index].split('/')[0];
        var id = keys[index].split('/')[1];
        if(!(coll in seen)) {
            var m = new fupt.Mapping();
            m.setName(coll);
            m.setIdsList([]);
            m.setIdsEpochList([]);
            m.setDelList([]);
            m.setDelEpochList([]);
        } else {
            for(var j = 0; j < mappings.length; j++) {
                if(mappings[j].getName() == coll) {
                    var m = mappings[j];
                    break;
                }
            }
        }
        
        //Add the info about the current object
        if(known[keys[index]].empty) {
            var p = m.getDelList();
            p.push(id);
            m.setDelList(p);
            p = m.getDelEpochList();
            p.push(known[keys[index]].upd);
            m.setDelEpochList(p);
        } else {
            var p = m.getIdsList();
            p.push(id);
            m.setIdsList(p);
            p = m.getIdsEpochList();
            p.push(known[keys[index]].upd);
            m.setIdsEpochList(p);
        }

        if(!(coll in seen)) {
            seen[coll] = true;
            mappings.push(m);
        }
    }
    msg.setMappingsList(mappings);

    var payload = new Buffer(zip.compressFile(msg.serializeBinary()));
    RMQUp[1].publish(RMQUp[2], '', payload);
    console.log('[' + utils.RUNNING_ADDR + '] Dispatched update to RMQ queue ' + RMQUp[2] + '.');
}

/**
 * Read an update.
 * @function update
 * @public
 * @param {Object} msg The message.
 */
function update(msg: any) {
    var now = (new Date).getTime();
    var load = fupt.FullUpdate.deserializeBinary(zip.decompressFile(new Uint8Array(msg.content)));
    var fromer = load.getFromer();
    console.log('[' + utils.RUNNING_ADDR + '] Received update from ' + fromer + '.');
    var coll = load.getMappingsList();
    for(var i = 0; i < coll.length; i++) {
        var name = coll[i].getName();
        var ids: string[] = coll[i].getIdsList();
        var ids_epoch: number[] = coll[i].getIDsEpochList();
        var del: string[] = coll[i].getDeletedList();
        var del_epoch: number[] = coll[i].getDelEpochList();
        //Mark as new updated or deleted ones
        for(var j = 0; j < ids.length; j++) {
            if(!((name + '/' + ids[j]) in known) || ids_epoch[j] > known[name + '/' + ids[j]].upd) {
                known[name + '/' + ids[j]] = {
                    upd: ids_epoch[j],
                    contacts: [fromer],
                    empty: false
                }
            }
        }
        for(var j = 0; j < del.length; j++) {
            if(!((name + '/' + del[j]) in known) || del_epoch[j] > known[name + '/' + del[j]].upd) {
                known[name + '/' + del[j]] = {
                    upd: del_epoch[j],
                    contacts: [fromer],
                    empty: true
                }
            }
        }
        //Add known copies
        for(var j = 0; j < ids.length; j++) {
            if((name + '/' + ids[j]) in known && ids_epoch[j] == known[name + '/' + ids[j]].upd && known[name + '/' + ids[j]].contacts.indexOf(fromer) == -1) {
                known[name + '/' + ids[j]].contacts.push(fromer);
            }
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
            if(err) {
                console.log('Cannot use RabbitMQ message broker. Standalone instance.');
                return;
            }
            if(!!utils.WHIGIHOST) {
                ch.assertExchange(utils.WHIGIHOST, 'fanout', {durable: true});
                RMQUp = [conn, ch, utils.WHIGIHOST];
                scd.scheduleJob('*/1 * * * *', recUpdate);
            }
            ch.assertExchange(ep.rabbitexc, 'fanout', {durable: true});
            ch.assertQueue('', {exclusive: true}, function(err, q) {
                if(err) {
                    console.log('Cannot use RabbitMQ message broker. Standalone instance.');
                    return;
                }
                ch.bindQueue(q.queue, ep.rabbitexc, '');
                ch.consume(q.queue, update);
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
    if(!!RMQUp) {
        RMQUp[0].close();
    }
}

/**
 * Search for a data.
 * @function question
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function question(req, res) {
    var got = req.body;
    var ip = !!req.headers['x-forwarded-for']? req.headers['x-forwarded-for'].split(', ')[0] : req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(got.key == require('../common/key.json').key && (!flags[ip] || Object.getOwnPropertyNames(flags[got.host][ip]).length < 2)) {
        if(!utils.WHIGIHOST && (!known[got.collection + '/' + got.id] || known[got.collection + '/' + got.id].empty)) {
            //We know it does not exist
            res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
        } else if(!!known[got.collection + '/' + got.id] && !known[got.collection + '/' + got.id].empty) {
            //We know it exists, find where
            var ret = known[got.collection + '/' + got.id].contacts.filter(function(el): boolean {
                return el.indexOf('domain') != 0;
            });
            if(ret.length > 0) {
                res.type('application/json').status(200).json({points: ret});
            } else {
                recQuestion(known[got.collection + '/' + got.id].contacts[0], got.collection, got.id).then(function(points) {
                    res.type('application/json').status(200).json({points: points});
                }, function(e) {
                    delete known[got.collection + '/' + got.id];
                    res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
                });
            }
        } else {
            //You know nothing, Jon Snow
            recQuestion(utils.WHIGIHOST, got.collection, got.id).then(function(points) {
                res.type('application/json').status(200).json({points: points});
            }, function(e) {
                res.type('application/json').status(404).json({error: utils.i18n('client.noData', req)});
            });
        }
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
            var keys = Object.getOwnPropertyNames(known);
            for(var i = 0; i < keys.length; i++) {
                delete known[keys[i]].contacts[ip];
                if(known[keys[i]].contacts.length == 0)
                    delete known[keys[i]];
            }
        }
        res.type('application/json').status(200).json({error: ''});
    } else {
        res.type('application/json').status(403).json({error: utils.i18n('client.auth', req)});
    }
}