/**
 * Class for uploading information about known data.
 * @module Uploader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var scd = require('node-schedule');
var querystring = require('querystring');
var https = require('https');
var fupt = require('./full-update_pb');
import {BloomFilter} from '../../utils/BloomFilter';
var collections: string[];
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
        if(collections[i] == 'users') {
            db.collection('users').find({}, {_id: true, email: true}).toArray().then(function(data) {
                var ret = new Array(2 * data.length);
                for(var j = 0; j < data.length; j += 2) {
                    ret[j] = data[j]._id;
                    ret[j+1] = data[j].email;
                }
                ids['users'] = ret;
                complete();
            }, function() {
                complete();
            });
        } else {
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
}

/**
 * Does a partial export.
 * @function partial
 * @private
 */
function partial() {
    var msg = new fupt.FullUpdate();
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
     * @param {Number} partial Time between partial updates. Should be 1, 2, 4, 6, 12, 24. Defaults to 24.
     * @param {Object} conn Connection to local database.
     * @param {String[]} coll Collections.
     */
    constructor(private full: number, private partial: number, conn: any, coll: string[]) {
        var rule = new scd.RecurrenceRule();
        switch(full) {
            case 1:
                break;
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
                rule.hour = [0, 12];
                break;
            case 24:
            default:
                rule.hour = [0];
                break;
        }
        rule.minute = Math.floor(Math.random() * 59);
        scd.scheduleJob(rule, full);

        rule = new scd.RecurrenceRule();
        switch(full) {
            case 1:
                break;
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
                rule.hour = [0, 12];
                break;
            case 24:
            default:
                rule.hour = [0];
                break;
        }
        rule.minute = Math.floor(Math.random() * 59);
        scd.scheduleJob(rule, partial);

        db = conn;
        collections = coll;
        updates = {};
        deleted = {}
        filter = new BloomFilter(Math.pow(2, 20), 1000000);
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
        if(filter.contains(id)) {
            if(deleted) {
                deleted[name] = deleted[name] || [];
                if(deleted[name].indexOf(id) == -1)
                    deleted[name].push(id);
            } else {
                updates[name] = updates[name] || [];
                if(updates[name].indexOf(id) == -1)
                    updates[name].push(id);
            }
        }
        filter.add(id);
    }

}
