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
var hash = require('js-sha256');
var mc = require('promised-mongo');
var BS = require('passport-http').BasicStrategy;
var TS = require('passport-token-auth');
var utils = require('../utils/utils');
var checks = require('../utils/checks');
var user = require('./user');
var data = require('./data');
var datasources = require('../common/Datasource');
var db;
var DEBUG = true;

//Set the running configuration
//Launch as >$ node index.js 443 whigi.envict.com for instance
var httpsport = parseInt(process.argv[2]) || 443;
var localhost = process.argv[3] || 'localhost';
utils.RESTOREHOST = 'localhost'; 
utils.RUNNING_ADDR = 'https://' + localhost + ':' + httpsport;
utils.MAIL_ADDR = "whigi.com@gmail.com";

/**
 * Returns the allowed HTTP vers on a ressource.
 * @function listOptions
 * @private
 * @param {String} path The path.
 * @param {Response} res The response.
 * @param {Function} next 404 Handler.
 */
function listOptions(path, res, next) {
    if(path.match(/\/api\/v[1-9]\/user\/create\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/user\/[a-zA-Z0-9\.%]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/update\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/activate\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/deactivate\/?$/))
        res.set('Access-Control-Allow-Methods', 'DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/token\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/token\/?$/))
        res.set('Access-Control-Allow-Methods', 'DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/restore-token\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/oauth\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/oauth\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'DELETE').type('application/json').status(200).json({error: ''});
    //-----
    else if(path.match(/\/api\/v[1-9]\/ask\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/data\/[a-zA-Z0-9%]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/time\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/any\/[a-zA-Z0-9]+\/[a-z]+\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/any\/remove\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    //-----
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
    var d;
    if(DEBUG)
        d = mc('localhost:27017/whigi');
    else
        d = mc('whigiuser:sorryMeND3dIoKwR@localhost:27017/whigi');
    if(d) {
        db = new datasources.Datasource(d);
        user.managerInit(db);
        data.managerInit(db);
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
pass.use(new BS(function(username, hpwd, done) {
    db.retrieveUser('username', username).then(function(user) {
        if(!!user) {
            if(user.is_activated && hash.sha256(hpwd + user.salt) == user.password) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } else {
            return done(null, false);
        }
    }, function(e) {
        return done(e);
    });
}));

/**
 * Authenticates a user.
 * @function auth
 * @public
 * @param {String} token Token.
 * @param {Function} callback A callback function to execute with true if authentication was ok.
 */
pass.use(new TS(function(token, done) {
    token = utils.atob(token.split(' ')[1]);

    function complete(ticket, is_token) {
        db.retrieveUser('id', ticket.bearer_id).then(function(user) {
            if(is_token) {
                ticket.last_refresh = (new Date).getTime();
                ticket.persist();
            } else {
                user.impersonated_prefix = ticket.prefix;
            }
            return done(null, user);
        }, function(e) {
            return done(e);
        });
    }

    db.retrieveToken(token).then(function(ticket) {
        if(!!ticket) {
            if(ticket.is_eternal == false && ticket.last_refresh < (new Date).getTime() - 30*60*1000) {
                ticket.unlink();
                return done(null, false);
            } else {
                complete(ticket, true);
            }
        } else {
            db.retrieveOauth(token).then(function(ticket) {
                if(!!ticket) {
                    complete(ticket, false);
                } else {
                    return done(null, false);
                }
            });
        }
    }, function(e) {
        return done(e);
    });
}));

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

    //API AUTH DECLARATIONS
    app.get('/api/v:version/user/:id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/profile', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/profile/data', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/data/new', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/update', pass.authenticate('basic', {session: false}));
    app.delete('/api/v:version/profile/deactivate', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/token/new', pass.authenticate('basic', {session: false}));
    app.delete('/api/v:version/profile/token', pass.authenticate(['token', 'basic'], {session: false}));
    //-----
    app.post('/api/v:version/ask', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/data/:id', pass.authenticate(['token', 'basic'], {session: false}));
    app.delete('/api/v:version/data/:data_name', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/vault/new', pass.authenticate(['token', 'basic'], {session: false}));
    app.delete('/api/v:version/vault/:vault_id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/vault/:vault_id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/vault/time/:vault_id', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/oauth/new', pass.authenticate(['token', 'basic'], {session: false}));
    app.delete('/api/v:version/oauth/:id', pass.authenticate(['token', 'basic'], {session: false}));
    //API LIMITATIONS FOR OAUTH
    app.post('/api/v:version/profile/data/new', checks.checkOAuth(true));
    app.post('/api/v:version/profile/update', checks.checkOAuth(true));
    app.delete('/api/v:version/profile/deactivate', checks.checkOAuth(true));
    app.post('/api/v:version/profile/token/new', checks.checkOAuth(true));
    app.delete('/api/v:version/profile/token', checks.checkOAuth(true));
    //-----
    app.post('/api/v:version/ask', checks.checkOAuth(true));
    app.get('/api/v:version/data/:id', checks.checkOAuth(false));
    app.delete('/api/v:version/data/:data_name', checks.checkOAuth(true));
    app.post('/api/v:version/vault/new', checks.checkOAuth(true));
    app.delete('/api/v:version/vault/:vault_id', checks.checkOAuth(true));
    app.get('/api/v:version/vault/:vault_id', checks.checkOAuth(true));
    app.get('/api/v:version/vault/time/:vault_id', checks.checkOAuth(true));
    app.post('/api/v:version/oauth/new', checks.checkOAuth(true));
    app.delete('/api/v:version/oauth/:id', checks.checkOAuth(true));
    //API POST CHECKS
    app.post('/api/v:version/profile/data/new', checks.checkBody(['name', 'encr_data']));
    app.post('/api/v:version/profile/update', checks.checkBody(['new_password', 'encr_master_key']));
    app.post('/api/v:version/user/create', checks.checkBody(['first_name', 'last_name', 'username', 'email', 'password', 'recuperable', 'safe', 'recup_mail']));
    app.post('/api/v:version/profile/token/new', checks.checkBody(['is_eternal']));
    app.post('/api/v:version/oauth/new', checks.checkBody(['for_id', 'prefix', 'token']));
    //-----
    app.post('/api/v:version/ask', checks.checkBody(['email_to', 'data_name']));
    app.post('/api/v:version/vault/new', checks.checkBody(['data_name', 'shared_to_id', 'aes_crypted_shared_pub', 'data_crypted_aes']));
    //API LONG LIVED COMMANDS
    app.get('/api/v:version/user/:id', checks.checkPuzzle);
    app.post('/api/v:version/profile/data/new', checks.checkPuzzle);
    app.post('/api/v:version/profile/token/new', checks.checkPuzzle);
    //-----
    app.post('/api/v:version/ask', checks.checkPuzzle);
    app.post('/api/v:version/vault/new', checks.checkPuzzle);
    app.get('/api/v:version/vault/:vault_id', checks.checkPuzzle);
    //API ROUTES
    app.get('/api/v:version/user/:id', user.getUser);
    app.get('/api/v:version/profile', user.getProfile);
    app.get('/api/v:version/profile/data', user.listData);
    app.post('/api/v:version/profile/data/new', user.recData);
    app.post('/api/v:version/profile/update', user.updateUser);
    app.post('/api/v:version/user/create', user.regUser);
    app.get('/api/v:version/activate/:key', user.activateUser);
    app.delete('/api/v:version/profile/deactivate', user.deactivateUser);
    app.post('/api/v:version/profile/token/new', user.newToken);
    app.delete('/api/v:version/profile/token', user.removeToken);
    app.post('/api/v:version/profile/restore-token', user.restoreToken);
    app.post('/api/v:version/oauth/new', user.createOAuth);
    app.delete('/api/v:version/oauth/:id', user.removeOAuth);
    //------
    app.post('/api/v:version/ask', data.ask);
    app.get('/api/v:version/data/:id', data.getData);
    app.delete('/api/v:version/data/:data_name', data.removeData);
    app.post('/api/v:version/vault/new', data.regVault);
    app.delete('/api/v:version/vault/:vault_id', data.removeVault);
    app.get('/api/v:version/vault/:vault_id', data.getVault);
    app.get('/api/v:version/vault/time/:vault_id', data.accessVault);
    app.get('/api/v:version/any/:key/:collection/:id', data.getAny);
    app.post('/api/v:version/any/remove', data.removeAny);

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
    if(DEBUG == false) {
        process.on('uncaughtException', function(err) {
            console.log(err);
        });
    }
    
    var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-cert.pem')}, app);
    servers.listen(httpsport);
    console.log('Booststrap finished.'); 
});