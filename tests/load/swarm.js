/**
 * A test for saturated accounts.
 * @module swarm
 * @author Mathonet Grégoire
 */

'use strict';
var https = require('https');
var fs = require('fs');
var pki = require('node-forge').pki;
var utils = require('../../utils/utils');

/**
 * Creates a random user on localhost.
 * @function createOne
 * @public
 * @param {Number} i Iteration.
 * @param {Boolean} ident Whether to auth.
 * @param {String} path Path.
 * @param {Object} data Some POST data.
 * @param {Function} cb Callback. 
 */
function createOne(i, ident, path, data, cb, get) {
    data = JSON.stringify(data);
    var options = {
        host: 'localhost',
        port: 443,
        path: path,
        method: !!get? 'GET' : 'POST',
        headers: {}
    };
    if(!get) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    if(ident) {
        options['key'] = fs.readFileSync(__dirname + '/../../whigi/whigi-key.pem');
        options['cert'] = fs.readFileSync(__dirname + '/../../whigi-restore/whigi-restore-cert.pem');
    }
    var ht = https.request(options, function(res) {
        var r = '';
        res.on('data', function(chunk) {
            r += chunk;
        });
        res.on('end', function() {
            var res = JSON.parse(r);
            if(!res.error) {
                cb(i + 1, res);
            } else {
                console.log('ERROR IN CALL TO WHIGI:');
                console.log(res);
                cb(i, res);
            }
        });
    }).on('error', function(err) {
        console.log('ERROR IN CALL TO WHIGI:');
        console.log(err);
        cb(i);
    });
    if(!get)
        ht.write(data);
    ht.end();
}

var done = 0, max = 50000, first = utils.generateRandomString(12), needed = first;
var kp = pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});
var pPem = pki.privateKeyToPem(kp.privateKey), PPem = pki.publicKeyToPem(kp.publicKey);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
//Now do!
function final(get) {
    createOne(0, true, '/api/v1/profile/data', {
        maybe_stale: [],
        needed: [first]
    }, function(now, res) {
        console.log(now, res);
    }, get);
}
function createMore() {
    createOne(done, false, '/api/v1/user/create', {
        username: needed,
        password: 'dummydummy',
        public_key: PPem,
        private_key: pPem,
        more: [
            {
                real_name: 'keys/pwd/mine1',
                shared_as: 'keys/pwd/mine1',
                data: 'dummy',
                is_dated: false,
                shared_trigger: '',
                shared_epoch: 0,
                version: 0,
                shared_to: ['whigi-restore']
            },
            {
                real_name: 'keys/pwd/mine2',
                shared_as: 'keys/pwd/mine2',
                data: 'dummy',
                is_dated: false,
                shared_trigger: '',
                shared_epoch: 0,
                version: 0,
                shared_to: ['whigi-restore']
            }
        ]
    }, function(now) {
        done = now;
        needed = utils.generateRandomString(12);
        if(done % 100 == 0) {
            console.log('Done: ' + done);
        } 
        if(now < 50000) {
            createMore();
        } else {
            final();
        }
    });
}

//Check if we want to check...
if(process.argv[2] === 'false') {
    createMore();
} else if(process.argv[2] === 'get') {
    final(true);
} else {
    first = process.argv[2];
    final();
}