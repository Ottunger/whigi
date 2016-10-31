/**
 * Class for uploading information about known data.
 * @module Uploader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var scd = require('node-schedule');
var https = require('https');
var amqp = require('amqplib/callback_api');
var zip = require('compressjs').Lzp3;
var fupt = require('./full-update_pb');
var utils = require('../../utils/utils');
import {BloomFilter} from '../../utils/BloomFilter';
var collections: string[], RMQ: any[];
var db: any, updates: any, deleted: any;
var filter: BloomFilter;

/**
 * Actually sends the message to the endpoints.
 * @function end
 * @private
 * @param {Object} msg The protobuf msg.
 * @param {Boolean} upt True if only update.
 */
function end(msg: any, upt: boolean) {
    var payload = new Buffer(zip.compressFile(msg.serializeBinary()));
    RMQ[1].publish(RMQ[2], upt? 'update' : 'full', payload);
    console.log('Dispatched update to RMQ queue ' + RMQ[2] + ', mode ' + (upt? 'update' : 'full') + '.');
}

/**
 * Does a full export.
 * @function fullFn
 * @private
 */
function fullFn() {
    var ids = {}, done = 0;

    function complete() {
        done++;
        if(done == collections.length) {
            var msg = new fupt.FullUpdate();
            msg.setFromer(utils.RUNNING_ADDR);
            var mappings = [];
            for(var key in ids) {
                if(ids.hasOwnProperty(key)) {
                    var m = new fupt.Mapping();
                    m.setName(key);
                    m.setIdsList(ids[key]);
                    mappings.push(m);
                    delete ids[key];
                }
            }
            msg.setMappingsList(mappings);
            end(msg, false);
        }
    }

    for(var i = 0; i < collections.length; i++) {
        db.collection(collections[i]).find({}, {_id: true}).toArray().then(function(data) {
            var ret = new Array(data.length);
            for(var j = 0; j < data.length; j++) {
                ret[j] = data[j]._id;
            }
            ids[collections[i]] = ret;
            complete();
        }, function() {
            complete();
        });
    }
}

/**
 * Does a partial export.
 * @function partialFn
 * @private
 */
function partialFn() {
    var msg = new fupt.FullUpdate();
    msg.setFromer(utils.RUNNING_ADDR);
    var mappings = [];
    for(var key in updates) {
        if(updates.hasOwnProperty(key)) {
            var m = new fupt.Mapping();
            m.setName(key);
            m.setIdsList(updates[key]);
            m.setDeletedList(deleted[key]);
            mappings.push(m);
            delete updates[key];
        }
    }
    msg.setMappingsList(mappings);

    //Refresh updates
    updates = {};
    deleted = {}
    filter = new BloomFilter(Math.pow(2, 20), 1000000);

    end(msg, true);
}

export class Uploader {

    /**
     * Creates an uploader.
     * @function constructor
     * @public
     * @param {Number} full Hours between full exports. Should be 1, 2, 4, 6, 12, 24. Defaults to 24.
     * @param {Number} partial Time between partial updates. Expressed in minutes.
     * @param {Object} conn Connection to local database.
     * @param {String[]} coll Collections.
     */
    constructor(private full: number, private partial: number, conn: any, coll: string[]) {
        var ep = require('./endpoints.json');
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
                var rq = ep.rabbitexc;
                ch.assertExchange(rq, 'fanout', {durable: true});

                RMQ = [conn, ch, rq];
                var rule = new scd.RecurrenceRule();
                switch(full) {
                    case 1:
                        break;
                    case 2:
                        rule.hour = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(function(el) { return el + Math.floor(Math.random() * 2) });
                        break;
                    case 4:
                        rule.hour = [0, 4, 8, 12, 16, 20].map(function(el) { return el + Math.floor(Math.random() * 4) });
                        break;
                    case 6:
                        rule.hour = [0, 6, 12, 18].map(function(el) { return el + Math.floor(Math.random() * 6) });
                        break;
                    case 12:
                        rule.hour = [0, 12].map(function(el) { return el + Math.floor(Math.random() * 12) });
                        break;
                    case 24:
                    default:
                        rule.hour = [Math.floor(Math.random() * 24)];
                        break;
                }
                rule.minute = Math.floor(Math.random() * 60);
                scd.scheduleJob(rule, fullFn);
                scd.scheduleJob('*/' + partial + ' * * * *', partialFn);

                db = conn;
                collections = coll;
                updates = {};
                deleted = {}
                filter = new BloomFilter(Math.pow(2, 20), 1000000);
            });
        });
    }

    /**
     * Mark an item as updated.
     * @function updated
     * @public
     * @param {String} id Id.
     * @param {String} name collection name.
     * @param {Boolean} deleted Deleted or not.
     */
    markUpdated(id: string, name: string, deleted: boolean) {
        if(!RMQ)
            return;
        if(deleted) {
            deleted[name] = deleted[name] || [];
            if(deleted[name].indexOf(id) == -1)
                deleted[name].push(id);
        } else {
            if(filter.contains(id)) {
                updates[name] = updates[name] || [];
                if(updates[name].indexOf(id) == -1)
                    updates[name].push(id);
            }
        }
        filter.add(id);
    }

    /**
     * Close RMQ.
     * @function close
     * @public
     */
    close() {
        if(!!RMQ) {
            RMQ[0].close();
        }
    }

    /**
     * Is connection made.
     * @function isReady
     * @public
     * @return {Boolean} Connection made.
     */
    isReady(): boolean {
        return !!RMQ;
    }

}
