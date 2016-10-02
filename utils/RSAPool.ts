/**
 * Class for generating RSA keys while idling.
 * @module RSAPool
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var RSA = require('node-rsa');
var scd = require('node-schedule');
var sys = require('sys')
var exec = require('child_process').exec;
var bits: number;
var where: number;
var until: number
var max : number;
var low_spline: boolean;
var keys: any[];

/**
 * Tries to generate a key then load it.
 * @function genKey
 * @private
 */
function genKey() {
    if(until == where)
        return;
    exec('openssl genrsa -out new_private_key.pem ' + (low_spline? '-3 ' : '') + bits, function(err, stdout, stderr) {
        if(!!err)
            return;
        exec('cat new_private_key.pem', function(err, stdout, stderr) {
            if(!!err)
                return;
            try {
                keys[until] = new RSA(stdout);
                until = (until + 1) % max;
            } catch(e) {}
        });
    });
}

export class RSAPool {

    /**
     * Creates an RSAPool.
     * @function constructor
     * @public
     * @param {Number} max_n Number of key pairs.
     * @param {Number} bits_size Key size.
     * @param {Boolean} is_low Key spline.
     */
    constructor(max_n: number, bits_size: number, is_low: boolean) {
        keys = new Array(max_n);
        where = 0;
        until = 1;
        max = max_n;
        bits = bits_size;
        low_spline = is_low;

        scd.scheduleJob('/5 * * * * *', genKey);
    }

    /**
     * Sends back the next key pair.
     * @function nextKeyPair
     * @public
     * @return {RSA} Key.
     */
    nextKeyPair() {
        if(where == until - 1) {
            var key = new RSA();
            key.generateKeyPair(bits, low_spline? 3 : 65537);
            return key;
        } else {
            var key = keys[where + 1];
            keys[where + 1] = undefined;
            where = (where + 1) % max;
            return key;
        }
    }

}
