/**
 * Node entry point for Whigi-giveaway.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
var http = require('http');
var fs = require('fs');
var mc = require('promised-mongo');
var utils = require('../utils/utils');
var mapping = require('./mapping');
var db;

//Set the running configuration
//Launch as ">$ node index.js 80 whigi-giveaway.envict.com whigi.envict.com whigi.com@gmail.com false" for instance
var httpport = parseInt(process.argv[2]) || 80;
var localhost = process.argv[3] || 'localhost';
utils.WHIGIHOST = process.argv[4] ||'localhost'; 
utils.RUNNING_ADDR = 'https://' + utils.WHIGIHOST;
utils.MAIL_ADDR = process.argv[5] || "whigi.com@gmail.com";
utils.DEBUG = !!process.argv[6]? process.argv[6] : true;

/**
 * Sets the API to connect to the database.
 * @function connect
 * @public
 * @param {Function} callback Callback.
 */ 
function connect(callback) {
    if(utils.DEBUG)
        db = mc('localhost:27017/whigi-giveaway');
    else
        db = mc('whigiuser:sorryMeND3dIoKwR@localhost:27017/whigi-giveaway');
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
    app.get('/api/v:version/create', mapping.create);

    //Error route
    app.use(function(req, res) {
        res.type('application/json').status(404).json({error: utils.i18n('client.notFound', req)});
    });

    process.on('SIGTERM', close);
    process.on('SIGINT', close);
    if(utils.DEBUG == false) {
        process.on('uncaughtException', function(err) {
            console.log(err);
        });
    }
    
    var server = http.createServer(app);
    server.listen(httpport);
    console.log('Booststrap finished.'); 
});