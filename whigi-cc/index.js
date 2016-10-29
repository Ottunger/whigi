/**
 * Node entry point for Whigi-CC.
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
//Launch as ">$ node index.js 443 whigi-cc.envict.com false domain whigi-cc.general.com" for instance
var httpsport = parseInt(process.argv[2]) || 443;
var localhost = process.argv[3] || 'localhost';
utils.DEBUG = !!process.argv[4]? process.argv[4] : true;
utils.RUNNING_ADDR = process.argv[5] || 'domain192.68.12.12';
utils.WHIGIHOST = (!!process.argv[6] && process.argv[6] != 'null')? process.argv[6] : undefined;
utils.ENDPOINTS = !!process.argv[7]? process.argv[7] : '../common/cdnize/endpoints.json';
if(utils.DEBUG)
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
        console.log(err);
    });
}

var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-cc-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-cc-cert.pem')}, app);
servers.listen(httpsport);
console.log('Booststrap finished.');