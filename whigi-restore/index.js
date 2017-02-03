/**
 * Node entry point for Whigi-restore.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');
var utils = require('../utils/utils');
var mapping = require('./mapping');

//Set the running configuration
//Launch as ">$ node index.js localhost" for instance
var configs = require('./configs.json');
var config = configs[process.argv[2]];
var httpport = config.port;
var localhost = config.localhost;
utils.WHIGIHOST = config.whigihost; 
utils.RUNNING_ADDR = 'https://' + utils.WHIGIHOST;
utils.MAIL_ADDR = config.mail;
utils.DEBUG = config.debug;
if(utils.DEBUG)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Sets the API to connect to the database.
 * @function connect
 * @public
 * @param {Function} callback Callback.
 */ 
function connect(callback) {
    mapping.managerInit();
    callback(false);
}

/**
 * Closes connection to the database.
 * @function close
 * @public
 */ 
function close() {
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
    app.get('/api/v:version/get/:key', mapping.mapGet);
    app.get('/api/v:version/request/:id', mapping.requestMapping);
    app.get('/api/v:version/mix/:id/:half', mapping.mixMapping);

    //Error route
    app.use(function(req, res) {
        res.type('application/json').status(404).json({error: utils.i18n('client.notFound', req)});
    });

    process.on('SIGTERM', close);
    process.on('SIGINT', close);
    if(utils.DEBUG == false) {
        process.on('uncaughtException', function(err) {
            console.log(err, err.stack);
        });
    }
    
    if(config.https) {
        var servers = https.createServer({key: fs.readFileSync(__dirname + '/../whigi/whigi-key.pem'), cert: fs.readFileSync(__dirname + '/../whigi/whigi-cert.pem')}, app);
        servers.listen(httpport);
    } else {
        var server = http.createServer(app);
        server.listen(httpport);
    }
    console.log('Booststrap finished.'); 
});