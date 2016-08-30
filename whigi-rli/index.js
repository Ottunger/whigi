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
//Launch as ">$ node index.js 443 whigi-rli.envict.com false" for instance
var httpsport = parseInt(process.argv[2]) || 443;
var localhost = process.argv[3] || 'localhost';
var DEBUG = !!process.argv[4];

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
app.post('/full', mapping.full);
app.post('/partial', mapping.partial);
app.post('/question', mapping.question);
app.post('/flag', mapping.flag);

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

var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-rli-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-rli-cert.pem')}, app);
servers.listen(httpsport);
console.log('Booststrap finished.');