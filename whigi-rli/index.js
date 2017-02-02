/**
 * Node entry point for Whigi-RLI.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
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
utils.DEBUG = config.debug;
utils.ENDPOINTS = config.endpoints;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Closes connection to the database.
 * @function close
 * @public
 */ 
function close() {
    mapping.close();
    process.exit(0);
}

//Prepare scheduled tasks
mapping.managerInit();

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
app.post('/question', mapping.question);
app.post('/flag', mapping.flag);

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

var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-rli-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-rli-cert.pem')}, app);
servers.listen(httpsport);
console.log('Booststrap finished.');