/**
 * Node entry point for Whigi-giveaway.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var sess = require('express-session');
var helmet = require('helmet');
var body = require('body-parser');
var http = require('http');
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
var allowed = config.allowed;
utils.RESTOREHOST = config.domain;

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

//Now connect to DB then start serving requests
connect(function(e) {
    if(e) {
        console.log('Bootstrap could not be completed.');
        process.exit();
    }

    //Create the express application
    var app = express();
    app.set('trust proxy', 2);
    app.use(sess({
        secret: config.secret,
        resave: true,
        saveUninitialized: true,
        cookie: {httpOnly: true, secure: false}
    }));
    app.use(helmet());
    app.use(function(req, res, next) {
        if(allowed != '*')
            res.append('Access-Control-Allow-Origin', allowed);
        next();
    });
    app.use(body.json({limit: '5000mb'}));

    //API ROUTES
    app.get('/api/v:version/challenge', mapping.challenge);
    app.get('/api/v:version/create/:wptype', mapping.create);
    app.get('/api/v:version/remove', mapping.remove);

    //Error route
    app.use(function(req, res) {
        res.type('application/json').status(404).json({error: utils.i18n('client.notFound', req)});
    });

    process.on('SIGTERM', close);
    process.on('SIGINT', close);
    
    var server = http.createServer(app);
    server.listen(httpport);
    console.log('Booststrap finished.'); 
});