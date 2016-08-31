/**
 * Class for downloading information from another Whigi.
 * @module Downloader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var https = require('https');

export class Downloader {

    /**
     * Creates an downloader.
     * @function constructor
     * @public
     */
    constructor() {

    }

    /**
     * Tries to fetch an item.
     * @function fetch
     * @public
     * @param {String} id Id.
     * @param {String} name collection name.
     * @return {Promise} Result.
     */
    fetch(id: string, name: string): Promise {
        var endpoints = require('./endpoints.json').endpoints;
        var data = {
            collection: name,
            id: id,
            key: require('../../common/key.json').key
        };
        var asked = 0, points = {}, tried = 0, found = false, keys;

        return new Promise(function(resolve, reject) {
            function end() {
                tried++;
                if(!found && tried == keys.length)
                    reject();
            }
            function complete() {
                asked++;
                if(asked == endpoints.length) {
                    keys = Object.getOwnPropertyNames(points);
                    for(var i = 0; i < keys.length; i++) {
                        var options = {
                            host: keys[i],
                            port: 443,
                            path: '/api/v1/' + require('../../common/key.json').key + '/' + name + '/' + id,
                            method: 'GET'
                        };
                        var ht = https.request(options, function(res) {
                            var r = '';
                            res.on('data', function(chunk) {
                                r += chunk;
                            });
                            res.on('end', function() {
                                var res = JSON.parse(r);
                                if('error' in res) {
                                    end();
                                } else {
                                    tried++;
                                    found = true;
                                    resolve(res);
                                }
                            });
                        }).on('error', function(err) {
                            end();
                        });
                        ht.end();
                    }
                }
            }

            for(var i = 0; i < endpoints.length; i++) {
                var options = {
                    host: endpoints[i].host,
                    port: endpoints[i].port,
                    path: endpoints[i].pathQuestion,
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
                        var res = JSON.parse(r);
                        if(res.match) {
                            points = Object.assign(points, res.points);
                        }
                        complete();
                    });
                }).on('error', function(err) {
                    console.log('Cannot question ' + endpoints[i].host);
                    complete();
                });
                ht.write(data);
                ht.end();
            }
        });
    }

}
