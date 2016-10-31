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
var uptsize: number, RMQ: any[];
var updates: {[name: string]: number}, deleted: {[name: string]: number};

/**
 * Actually sends the message to the endpoints.
 * @function end
 * @private
 * @param {Object} msg The protobuf msg.
 */
function end(msg: any) {
    var payload = new Buffer(zip.compressFile(msg.serializeBinary()));
    RMQ[1].publish(RMQ[2], '', payload);
    console.log('[' + utils.RUNNING_ADDR + '] Dispatched update to RMQ queue ' + RMQ[2] + '.');
}

/**
 * Does a partial export.
 * @function updateFn
 * @private
 */
function updateFn() {
    var msg = new fupt.FullUpdate();
    msg.setFromer(utils.RUNNING_ADDR);
    var mappings = [], seen = {}, keys = Object.getOwnPropertyNames(deleted);

    //Deleted ones
    for(var i = 0; i < keys.length; i++) {
        var coll = keys[i].split('/')[0];
        var id = keys[i].split('/')[1];
        if(!(coll in seen)) {
            var m = new fupt.Mapping();
            m.setName(coll);
            m.setIdsList([]);
            m.setIdsEpochList([]);
            m.setDeletedList([]);
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
        var p = m.getDeletedList();
        p.push(id);
        m.setDeletedList(p);
        p = m.getDelEpochList();
        p.push(deleted[keys[i]]);
        m.setDelEpochList(p);

        if(!(coll in seen)) {
            seen[coll] = true;
            mappings.push(m);
        }
    }
    deleted = {};
    //Updated ones
    keys = Object.getOwnPropertyNames(updates);
    for(var i = 0; i < Math.min(uptsize, keys.length); i++) {
        var index = Math.floor(Math.random() * Math.min(uptsize, keys.length));
        var coll = keys[index].split('/')[0];
        var id = keys[index].split('/')[1];
        if(!(coll in seen)) {
            var m = new fupt.Mapping();
            m.setName(coll);
            m.setIdsList([]);
            m.setIdsEpochList([]);
            m.setDeletedList([]);
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
        var p = m.getIdsList();
        p.push(id);
        m.setIdsList(p);
        p = m.getIdsEpochList();
        p.push(updates[keys[index]]);
        m.setIdsEpochList(p);
        delete updates[keys[index]];

        if(!(coll in seen)) {
            seen[coll] = true;
            mappings.push(m);
        }
    }

    msg.setMappingsList(mappings);
    end(msg);
}

export class Uploader {

    /**
     * Creates an uploader.
     * @function constructor
     * @public
     * @param {Number} upt How many updates to send per 10sec.
     */
    constructor(upt: number) {
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
                var rq = ep.rabbitexc;
                ch.assertExchange(rq, 'fanout', {durable: true});

                RMQ = [conn, ch, rq];
                scd.scheduleJob('*/10 * * * *', updateFn);
                uptsize = upt;
                updates = {};
                deleted = {};
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
            deleted[name + '/' + id] = (new Date).getTime();
        } else {
            updates[name + '/' + id] = (new Date).getTime();
        }
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
