/**
 * Node entry point for Whigi.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
var https = require('https');
var pass = require('passport');
var fs = require('fs');
var BS = require('passport-http').BasicStrategy;
var mc = require('mongodb').MongoClient;
var utils = require('./utils');
var user = require('./user');
var datasources = require('./datasources/datasources');
var db, um;

//Set the running configuration
var httpsport = parseInt(process.argv[3]) || 443;
var localhost = process.argv[4] || 'localhost';
var httpslocal = 'https://' + localhost + ':' + httpsport;

/**
 * Returns the allowed HTTP vers on a ressource.
 * @function listOptions
 * @private
 * @param {String} path The path.
 * @param {Response} res The response.
 * @param {Function} next 404 Handler.
 */
/*
function listOptions(path, res, next) {
    if(path.match(/\/api\/v[1-9]\/user\/[0-9]+\/?/))
        res.set('Allow', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/user\/[0-9]+\/ratings\/[0-9]+\/[0-9]+\/?/))
        res.set('Allow', 'GET').type('application/json').status(200).json({error: ''});
    else
        next();
}
*/

/**
 * Sets the API to connect to the database.
 * @function connect
 * @public
 * @param {Function} callback Callback.
 */ 
function connect(callback) {
    mc.connect('mongodb://whigiuser:sorryMeND3dIoKwR@localhost:27017/whigi', function(e, d) {
        if(!e) {
            db = new datasources.Datasource(d);
            um = new user.UserManager(db);
        }
        callback(e);
    });
};

/**
 * Closes connection to the database.
 * @function close
 * @public
 */ 
function close() {
    if(db !== undefined) {
        db.closeUnderlying();
    }
    process.exit(0);
}

/**
 * Authenticates a user.
 * @function auth
 * @public
 * @param {String} user Username.
 * @param {String} pwd User's password.
 * @param {Function} callback A callback function to execute with true if authentication was ok.
 */
pass.use(new BS(function(user, pwd, done) {
    db.retrieveItem('users', 'username', user, function(e, ipwd) {
        if(!e && ipwd != undefined) {
            if(ipwd.is_activated) {
                if(hash.sha256(pwd + ipwd.salt) == ipwd.password)
                    return done(null, user);
                else {
                    return done(null, false);
                }
            } else {
                return done(null, false);
            }
        } else {
            return(e);
        }
    });
}));

var app = express();
app.use(helmet());
app.use(body.json());

//API use auth
app.use('/api/v:version/user/:id', pass.authenticate('basic', {session: false}));
//API long lived commands or populating database
//First one is to protect our user from crawlers
app.use('/api/v:version/user/:id', utils.checkPuzzle);
//API routes
app.get('/api/v:version/user/:id', um.getUser);

//Error route
app.use(function(req, res, next) {
    if(req.method == 'OPTIONS') {
        listOptions(req.path, res, next);
    } else
        next();
}, function(req, res) {
    res.type('application/json').status(404).json({error: api.i18n('client.notFound', req)});
});

//Now connect to DB then start serving requests
connect(function(e) {
    if(e) {
        console.log('Bootstrap could not be completed.');
        process.exit();
    }
    process.on('SIGTERM', close);
    process.on('SIGINT', close);
    process.on('uncaughtException', function(err) {
        console.log(err);
    });
    
    var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-cert.pem')}, app);
    servers.listen(httpsport);
    console.log('Booststrap finished.'); 
});