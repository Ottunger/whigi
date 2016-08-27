/**
 * Node entry point for Whigi-restore.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
var https = require('https');
var fs = require('fs');
var mc = require('promised-mongo');
var utils = require('../utils/utils');
var mapping = require('./mapping');
var db;
var DEBUG = true;

//Set the running configuration
//Launch as >$ node index.js 443 whigi-restore.envict.com for instance
var httpsport = parseInt(process.argv[2]) || 443;
var localhost = process.argv[3] || 'localhost';
utils.WHIGIHOST = 'localhost'; 
utils.RUNNING_ADDR = 'https://' + localhost + ':' + httpsport;
utils.MAIL_ADDR = "whigi.com@gmail.com";

/**
 * Sets the API to connect to the database.
 * @function connect
 * @public
 * @param {Function} callback Callback.
 */ 
function connect(callback) {
    if(DEBUG)
        db = mc('localhost:27017/whigi-restore');
    else
        db = mc('whigiuser:sorryMeND3dIoKwR@localhost:27017/whigi-restore');
    if(db) {
        mapping.managerInit(db);
        callback(false)
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
    if(db !== undefined) {
        db.close();
    }
    process.exit(0);
}

//Now connect to DB then start serving requests
connect(function(e) {
    if(e) {
        console.log('Bootstrap could not be completed.');
        process.exit();
    }

    //Create the express application
    var app = express();
    if(DEBUG == false) {
        app.use(helmet());
    } else {
        app.use(function(req, res, next) {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
            next();
        });
    }
    app.use(body.json());

    //API ROUTES
    app.post('/api/v:version/new', mapping.newMapping);
    app.get('/api/v:version/request/:email', mapping.requestMapping);
    app.get('/api/v:version/key/:token', mapping.retrieveMapping);

    //Error route
    app.use(function(req, res) {
        res.type('application/json').status(404).json({error: utils.i18n('client.notFound', req)});
    });

    process.on('SIGTERM', close);
    process.on('SIGINT', close);
    if(DEBUG == false) {
        process.on('uncaughtException', function(err) {
            console.log(err);
        });
    }
    
    var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-restore-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-restore-cert.pem')}, app);
    servers.listen(httpsport);
    console.log('Booststrap finished.'); 
});