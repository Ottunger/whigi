/**
 * Class for uploadinginformation about known data.
 * @module Uploader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var scd = require('node-schedule');
var querystring = require('querystring');
var https = require('https');
var fupt = require('../../common/cdn/full-update');
var db: any;
var collections: string[];
var updates: any;

/**
 * Actually sends the message to the endpoints.
 * @function end
 * @private
 * @param {Object} msg The protobuf msg.
 * @param {Boolean} upt True if only update.
 */
function end(msg: any, upt: boolean) {
    var endpoints = require('./endpoints.json').endpoints;
    var data = querystring.stringify({
        payload: msg.serializeBinary(),
        key: require('../../common/key.json').key
    });
    for(var i = 0; i < endpoints.length; i++) {
        var options = {
            host: endpoints[i].host,
            port: endpoints[i].port,
            path: (upt? endpoints[i].pathPartial : endpoints[i].pathFull),
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
                console.log('Update to ' + endpoints[i].host + ' ended with answer "' + r + '"');
            });
        }).on('error', function(err) {
            console.log('Cannot do an update to ' + endpoints[i].host);
        });
        ht.write(data);
        ht.end();
    }
}

/**
 * Does a full export.
 * @function full
 * @private
 */
function full() {
    var ids = {}, done = 0;

    function complete() {
        done++;
        if(done == collections.length) {
            var msg = new fupt.FullUpdate();
            for(var key in ids) {
                if(ids.hasOwnProperty(key)) {
                    //TODO Check how protobuf does this
                    msg.addMapping();
                    msg.setPartial(false);
                    msg.mapping.setName(key);
                    msg.mapping.setIds(ids[key]);
                    delete ids[key];
                }
            }
            end(msg, false);
        }
    }

    for(var i = 0; i < collections.length; i++) {
        db.collection(collections[i]).find().toArray().then(function(data) {
            var ret = new Array(data.length);
            for(var j = 0; j < data.length; j++) {
                ret[i] = data[i]._id;
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
 * @function partial
 * @private
 */
function partial() {
    var msg = new fupt.FullUpdate();
    for(var key in updates) {
        if(updates.hasOwnProperty(key)) {
            //TODO Check how protobuf does this
            msg.addMapping();
            msg.setPartial(true);
            msg.mapping.setName(key);
            msg.mapping.setIds(updates[key]);
            delete updates[key];
        }
    }
    updates = {};
    end(msg, true);
}

export class Uploader {

    /**
     * Creates an uploader.
     * @function constructor
     * @public
     * @param {Number} full hours between full exports. Should be 2, 4, 6, 12. Defaults to 12.
     * @param {Number} partial Time between partial updates.
     * @param {Object} conn Connection to local database.
     * @param {String[]} coll Collections.
     */
    constructor(private full: number, private partial: number, conn: any, coll: string[]) {
        var rule = new scd.RecurrenceRule();
        switch(full) {
            case 2:
                rule.hour = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
                break;
            case 4:
                rule.hour = [0, 4, 8, 12, 16, 20];
                break;
            case 6:
                rule.hour = [0, 6, 12, 18];
                break;
            case 12:
            default:
                rule.hour = [0, 12];
                break;
        }
        rule.minute = Math.floor(Math.random() * 59);
        scd.scheduleJob(rule, full);

        rule = new scd.RecurrenceRule();
        switch(full) {
            case 2:
                rule.hour = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
                break;
            case 4:
                rule.hour = [0, 4, 8, 12, 16, 20];
                break;
            case 6:
                rule.hour = [0, 6, 12, 18];
                break;
            case 12:
            default:
                rule.hour = [0, 12];
                break;
        }
        rule.minute = Math.floor(Math.random() * 59);
        scd.scheduleJob(rule, partial);

        db = conn;
        collections = coll;
        updates = {};
    }

    /**
     * Mark an item as updated.
     * @function updated
     * @public
     * @param {String} id Id.
     * @param {String} name collection name.
     */
    markUpdated(id: string, name: string) {
        updates[name] = updates[name] || [];
        if(updates[name].indexOf(id) == -1)
            updates[name].push(id);
    }

}
