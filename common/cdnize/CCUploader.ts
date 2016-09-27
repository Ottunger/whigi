/**
 * Class for uploading information about known data.
 * @module Uploader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var scd = require('node-schedule');
var https = require('https');
var fupt = require('./full-update_pb');
var utils = require('../../utils/utils');
var uptsize: number;
var updates: {[name: string]: number}, deleted: {[name: string]: number};

/**
 * Actually sends the message to the endpoints.
 * @function end
 * @private
 * @param {Object} msg The protobuf msg.
 */
function end(msg: any) {
    var endpoints = require('./endpoints.json').endpoints;
    var data = {
        payload: msg.serializeBinary(),
        key: require('../../common/key.json').key
    };
    for(var i = 0; i < endpoints.length; i++) {
        var options = {
            host: endpoints[i].host,
            port: endpoints[i].port,
            path: endpoints[i].pathUpdate,
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
        var p = m.getDelList();
        p.push(id);
        m.setDelList(p);
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
        scd.scheduleJob('/10 * * * * *', updateFn);

        uptsize = upt;
        updates = {};
        deleted = {}
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
        if(deleted) {
            deleted[name + '/' + id] = (new Date).getTime();
        } else {
            updates[name + '/' + id] = (new Date).getTime();
        }
    }

}
