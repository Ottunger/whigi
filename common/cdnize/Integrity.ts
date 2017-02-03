/**
 * Class for checking integrity of other Whigi's.
 * @module Integrity
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var scd = require('node-schedule');
var sys = require('sys')
var exec = require('child_process').exec;
var https = require('https');
var fs = require('fs');
var utils = require('../../utils/utils');
var basedir: string;

/**
 * Flag a host as biaised.
 * @function end
 * @private
 * @param {String} host Corrupted host.
 */
function end(host: string) {
    var endpoints = require(utils.ENDPOINTS).endpoints;
    var data = {
        host: host
    };
    var lu = process.env.NODE_TLS_REJECT_UNAUTHORIZED, done = 0;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    for(var i = 0; i < endpoints.length; i++) {
        var options = {
            host: endpoints[i].host,
            port: endpoints[i].port,
            path: endpoints[i].pathFlag,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            key: fs.readFileSync(__dirname + '/../../whigi/whigi-key.pem'),
            cert: fs.readFileSync(__dirname + '/../../whigi/whigi-crt.pem')
        };
        var ht = https.request(options, function(res) {
            var r = '';
            res.on('data', function(chunk) {
                r += chunk;
            });
            res.on('end', function() {
                console.log('Flagging of ' + host + ' to ' + endpoints[i].host + ' ended with answer "' + r + '"');
                done++;
                if(done >= endpoints.length)
                    process.env.NODE_TLS_REJECT_UNAUTHORIZED = lu;
            });
        }).on('error', function(err) {
            console.log('Cannot flag ' + host + ' to ' + endpoints[i].host);
            done++;
            if(done >= endpoints.length)
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = lu;
        });
        ht.write(data);
        ht.end();
    }
}

/**
 * Does integrity check on other Whigi's.
 * @function check
 * @private
 */
function check() {
    var whigis = require('./whigis.json').whigis;
    for(var i = 0; i < whigis.length; i++) {
        exec('mkdir -p ' + whigis[i].tmpdir, function(err) {
            if(err)
                return;
            exec(basedir + '/common/cdnize/scripts/server.sh ' + whigis[i].tmpdir + ' ' + basedir + ' ' + whigis[i].host, function(err, stdout, stderr) {
                if(err || (!!stderr && stderr != '')) {
                    end(whigis[i].host);
                }
                exec('rm -rf ' + whigis[i].tmpdir);
            });
        });
    }
}

/**
 * Does integrity check on other Whigi's client side.
 * @function clientCheck
 * @private
 */
function clientCheck() {
    var whigis = require('./whigis.json').whigis;
    for(var i = 0; i < whigis.length; i++) {
        exec('mkdir -p ' + whigis[i].clienttmpdir, function(err) {
            if(err)
                return;
            exec(basedir + '/common/cdnize/scripts/client.sh ' + basedir + ' ' + whigis[i].host + ' ' + whigis[i].clienttmpdir, function(err, stdout, stderr) {
                if(err || (!!stderr && stderr != '')) {
                    end(whigis[i].host);
                }
                exec('rm -rf ' + whigis[i].clienttmpdir);
            });
        });
    }
}

export class Integrity {

    /**
     * Creates an integrity checker.
     * @function constructor
     * @public
     * @param {Number} spacing Hours between checks. Should be 1, 2, 4, 6, 12, 24. Defaults to 24.
     * @param {String} base_dir Directory of installation.
     */
    constructor(private spacing: number, base_dir: string) {
        var rule = new scd.RecurrenceRule();
        switch(spacing) {
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
        scd.scheduleJob(rule, check);
        scd.scheduleJob(rule, clientCheck);
        basedir = base_dir;
    }

}
