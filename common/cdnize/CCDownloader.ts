/**
 * Class for downloading information from another Whigi.
 * @module Downloader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
declare var Buffer: any
declare var __dirname: any
declare var process: any
var https = require('https');
var fs = require('fs');
var utils = require('../../utils/utils');

export class Downloader {

    /**
     * Creates a downloader.
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
    fetch(id: string, name: string): Promise<any> {
        var e = require(utils.ENDPOINTS);
        var endpoints = e.endpoints, hosts = e.hosts;
        var data = JSON.stringify({
            collection: name,
            id: id
        });
        var asked = 0, points = {}, tried = 0, found = false, keys, erred = false;
        var lu = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        return new Promise(function(resolve, reject) {
            function end(err) {
                tried++;
                if(!found && tried >= keys.length) {
                    if(erred)
                        reject(err);
                    else
                        resolve(null);
                }
            }
            function complete() {
                asked++;
                if(asked >= endpoints.length) {
                    process.env.NODE_TLS_REJECT_UNAUTHORIZED = lu;
                    keys = Object.getOwnPropertyNames(points);
                    for(var i = 0; i < keys.length; i++) {
                        var options = {
                            host: keys[i],
                            port: hosts[keys[i]],
                            path: '/api/v1/any/' + name + '/' + id,
                            method: 'GET',
                            key: fs.readFileSync(__dirname + '/../../whigi/whigi-key.pem'),
                            cert: fs.readFileSync(__dirname + '/../../whigi/whigi-cert.pem')
                        };
                        var ht = https.request(options, function(res) {
                            var r = '';
                            res.on('data', function(chunk) {
                                r += chunk;
                            });
                            res.on('end', function() {
                                var res = JSON.parse(r);
                                if('error' in res) {
                                    end(res.error);
                                } else {
                                    tried++;
                                    found = true;
                                    resolve(res);
                                }
                            });
                        }).on('error', function(err) {
                            erred = true;
                            end(err);
                        });
                        ht.end();
                    }
                    if(keys.length == 0) {
                        process.env.NODE_TLS_REJECT_UNAUTHORIZED = lu;
                        end('No suitable match');
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
                    },
                    key: fs.readFileSync(__dirname + '/../../whigi/whigi-key.pem'),
                    cert: fs.readFileSync(__dirname + '/../../whigi/whigi-cert.pem')
                };
                var ht = https.request(options, function(res) {
                    var r = '';
                    res.on('data', function(chunk) {
                        r += chunk;
                    });
                    res.on('end', function() {
                        var res = JSON.parse(r);
                        if(!!res.points) {
                            for(var i = 0; i < res.points.length; i++) {
                                points[res.points[i]] = true;
                            }
                        }
                        complete();
                    });
                }).on('error', function(err) {
                    console.log('Cannot question a domain with error: ', err);
                    complete();
                });
                ht.write(data);
                ht.end();
            }
        });
    }

}
