/**
 * Node entry point for Whigi-advert.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');
var mc = require('promised-mongo');
var utils = require('../utils/utils');
var mapping = require('./mapping');

//Set the running configuration
//Launch as ">$ node index.js 80 whigi-advert.envict.com whigi.envict.com whigi.com@gmail.com false false" for instance
var httpport = parseInt(process.argv[2]) || 80;
var localhost = process.argv[3] || 'localhost';
utils.WHIGIHOST = process.argv[4] || 'localhost'; 
utils.RUNNING_ADDR = 'https://' + utils.WHIGIHOST;
utils.MAIL_ADDR = process.argv[5] || 'whigi.com@gmail.com';
utils.DEBUG = !!process.argv[6]? process.argv[6] : true;
var isHttps = !!process.argv[7]? process.argv[7] : 'true';
var uaccount = !!process.argv[8]? process.argv[8] : 'whigi-advert-world';
if(utils.DEBUG)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Returns the allowed HTTP vers on a ressource.
 * @function listOptions
 * @private
 * @param {String} path The path.
 * @param {Response} res The response.
 * @param {Function} next 404 Handler.
 */
function listOptions(path, res, next) {
    if(path.match(/\/api\/v[1-9]\/search\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else
        next();
}

/**
 * Sets the API to connect to the database.
 * @function connect
 * @public
 * @param {Function} callback Callback.
 */ 
function connect(callback) {
    d = mc('localhost:27017/' + uaccount);
    if(d) {
        mapping.managerInit(uaccount, d);
        callback(false);
    } else {
        callback(true);
    }
}

/**
 * Closes connection to the database.
 * @function close
 * @public
 */ 
function close() {
    if(d !== undefined)
        d.close();
    process.exit(0);
}

//Now connect to services then start serving requests
connect(function(e) {
    if(e) {
        console.log('Bootstrap could not be completed.');
        process.exit();
    }

    //Create the express application
    var app = express();
    if(utils.DEBUG == false) {
        app.use(helmet());
    } else {
        app.use(function(req, res, next) {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
            next();
        });
    }
    app.use(body.json({limit: '5000mb'}));

    //API ROUTES
    app.post('/api/v:version/search', mapping.search);

    //Error route
    app.use(function(req, res, next) {
        if(req.method == 'OPTIONS') {
            listOptions(req.path, res, next);
        } else
            next();
    }, function(req, res) {
        res.type('application/json').status(404).json({error: utils.i18n('client.notFound', req)});
    });

    process.on('SIGTERM', close);
    process.on('SIGINT', close);
    if(utils.DEBUG == false) {
        process.on('uncaughtException', function(err) {
            console.log(err, err.stack);
        });
    }
    
    if(isHttps == 'true') {
        var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-advert-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-advert-cert.pem')}, app);
        servers.listen(httpport);
    } else {
        var server = http.createServer(app);
        server.listen(httpport);
    }
    console.log('Booststrap finished.'); 
});