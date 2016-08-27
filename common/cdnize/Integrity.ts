/**
 * Class for checking integrity of other Whigi's.
 * @module Integrity
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var scd = require('node-schedule');
var querystring = require('querystring');
var sys = require('sys')
var exec = require('child_process').exec;
var https = require('https');

/**
 * Flag a host as biaised.
 * @function end
 * @private
 * @param {String} host Corrupted host.
 */
function end(host: string) {
    var endpoints = require('./endpoints.json').endpoints;
    var data = querystring.stringify({
        host: host,
        key: require('../../common/key.json').key
    });
    for(var i = 0; i < endpoints.length; i++) {
        var options = {
            host: endpoints[i].host,
            port: endpoints[i].port,
            path: endpoints[i].pathFlag,
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
                console.log('Flagging of ' + host + ' to ' + endpoints[i].host + ' ended with answer "' + r + '"');
            });
        }).on('error', function(err) {
            console.log('Cannot flag ' + host + ' to ' + endpoints[i].host);
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
            exec('ftp -n < ' + whigis[i].cmd, function(err, stdout, stderr) {
                if(err || (!!stderr && stderr != '')) {
                    end(whigis[i].host);
                    exec('rm -rf ' + whigis[i].tmpdir);
                } else {
                    exec(whigis[i].check, function(err, stdout, stderr) {
                        if(!!stderr && stderr != '')
                            end(whigis[i].host);
                        exec('rm -rf ' + whigis[i].tmpdir);
                    });
                }
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
     */
    constructor(private spacing: number) {
        var rule = new scd.RecurrenceRule();
        switch(spacing) {
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
        scd.scheduleJob(rule, check);
    }

}
