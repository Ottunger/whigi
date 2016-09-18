/**
 * Node entry point for Whigi.
 * @module index
 * @author Mathonet Grégoire
 */

var express = require('express');
var helmet = require('helmet');
var body = require('body-parser');
var http = require('http');
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

//Set the running configuration
//Launch as ">$ node index.js 80 whigi.envict.com whigi-restore.envict.com whigi.com@gmail.com false false `pwd`" for instance
var httpport = parseInt(process.argv[2]) || 80;
var localhost = process.argv[3] || 'localhost';
utils.RESTOREHOST = process.argv[4] || 'localhost'; 
utils.RUNNING_ADDR = 'https://' + localhost;
utils.MAIL_ADDR = process.argv[5] || "whigi.com@gmail.com";
utils.DEBUG = !!process.argv[6]? (process.argv[6] == 'true'? true : false): 'true';
var isHttps = !!process.argv[7]? process.argv[7] : 'true';

/**
 * Returns the allowed HTTP vers on a ressource.
 * @function listOptions
 * @private
 * @param {String} path The path.
 * @param {Response} res The response.
 * @param {Function} next 404 Handler.
 */
function listOptions(path, res, next) {
    if(path.match(/\/api\/v[1-9]\/generics.json\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/peek\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/user\/create\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/close\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/info\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/user\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/update\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
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
    else if(path.match(/\/api\/v[1-9]\/eid\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/eid\/callback\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/eid\/bce\/[0-9]{10}\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    //-----
    else if(path.match(/\/api\/v[1-9]\/data\/[a-zA-Z0-9%]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/data\/trigger\/[a-zA-Z0-9%]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
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
    if(utils.DEBUG)
        d = mc('localhost:27017/whigi');
    else
        d = mc('whigiuser:sorryMeND3dIoKwR@localhost:27017/whigi');
    if(d) {
        db = new datasources.Datasource(d, process.argv[8]);
        user.managerInit(db);
        data.managerInit(db);
        checks.prepareRL();
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
 * @function -
 * @public
 * @param {String} user Username.
 * @param {String} pwd User's password.
 * @param {Function} callback A callback function to execute with true if authentication was ok.
 */
pass.use(new BS(function(username, hpwd, done) {
    db.retrieveUser(username).then(function(user) {
        if(!!user) {
            if(hash.sha256(hpwd + user.salt) == user.password || hash.sha256(hpwd) == user.sha_master) {
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
 * @function -
 * @public
 * @param {String} token Token.
 * @param {Function} callback A callback function to execute with true if authentication was ok.
 */
pass.use(new TS(function(token, done) {
    token = utils.atob(token.split(' ')[1]);

    function complete(ticket, is_token) {
        db.retrieveUser(ticket.bearer_id).then(function(user) {
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

    app.get('/api/v:version/generics.json', function(req, res) {
        res.type('application/json').status(200).json(require('./generics.json'));
    });
    //API AUTH DECLARATIONS
    app.get('/api/v:version/user/:id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/profile', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/close/:id', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/info', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/profile/data', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/data/new', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/update', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/profile/token/new', pass.authenticate('basic', {session: false}));
    app.delete('/api/v:version/profile/token', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/eid', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/eid/bce/:bce', pass.authenticate(['token', 'basic'], {session: false}));
    //-----
    app.get('/api/v:version/data/:id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/data/trigger/:data_name', pass.authenticate(['token', 'basic'], {session: false}));
    app.delete('/api/v:version/data/:data_name', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/vault/new', pass.authenticate(['token', 'basic'], {session: false}));
    app.delete('/api/v:version/vault/:vault_id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/vault/:vault_id', pass.authenticate(['token', 'basic'], {session: false}));
    app.get('/api/v:version/vault/time/:vault_id', pass.authenticate(['token', 'basic'], {session: false}));
    app.post('/api/v:version/oauth/new', pass.authenticate(['token', 'basic'], {session: false}));
    app.delete('/api/v:version/oauth/:id', pass.authenticate(['token', 'basic'], {session: false}));
    //API LIMITATIONS FOR OAUTH
    app.post('/api/v:version/close/:id', checks.checkOAuth(true));
    app.post('/api/v:version/profile/info', checks.checkOAuth(true));
    app.post('/api/v:version/profile/data/new', checks.checkOAuth(false, 1));
    app.post('/api/v:version/profile/update', checks.checkOAuth(true));
    app.post('/api/v:version/profile/token/new', checks.checkOAuth(true));
    app.delete('/api/v:version/profile/token', checks.checkOAuth(true));
    app.get('/api/v:version/eid', checks.checkOAuth(true));
    app.get('/api/v:version/eid/bce/:bce', checks.checkOAuth(true));
    //-----
    app.get('/api/v:version/data/:id', checks.checkOAuth(false, 0));
    app.delete('/api/v:version/data/:data_name', checks.checkOAuth(true));
    app.post('/api/v:version/vault/new', checks.checkOAuth(false, 2));
    app.delete('/api/v:version/vault/:vault_id', checks.checkOAuth(true));
    app.get('/api/v:version/vault/:vault_id', checks.checkOAuth(true));
    app.get('/api/v:version/vault/time/:vault_id', checks.checkOAuth(true));
    app.post('/api/v:version/oauth/new', checks.checkOAuth(true));
    app.delete('/api/v:version/oauth/:id', checks.checkOAuth(true));
    //API POST CHECKS
    app.post('/api/v:version/close/:id', checks.checkBody(['new_keys']));
    app.post('/api/v:version/profile/data/new', checks.checkBody(['name', 'encr_data', 'is_dated']));
    app.post('/api/v:version/profile/update', checks.checkBody(['new_password', 'encr_master_key', 'sha_master']));
    app.post('/api/v:version/user/create', checks.checkBody(['username', 'password']));
    app.post('/api/v:version/profile/token/new', checks.checkBody(['is_eternal']));
    app.post('/api/v:version/oauth/new', checks.checkBody(['for_id', 'prefix', 'token']));
    //-----
    app.post('/api/v:version/vault/new', checks.checkBody(['data_name', 'shared_to_id', 'aes_crypted_shared_pub', 'data_crypted_aes', 'expire_epoch', 'trigger', 'real_name']));
    //API LONG LIVED COMMANDS
    app.post('/api/v:version/close/:id', checks.checkPuzzle);
    app.post('/api/v:version/profile/data/new', checks.checkPuzzle);
    app.post('/api/v:version/profile/token/new', checks.checkPuzzle);
    //-----
    app.post('/api/v:version/vault/new', checks.checkPuzzle);
    //API ROUTES
    app.get('/api/v:version/peek/:id', user.peekUser);
    app.get('/api/v:version/user/:id', user.getUser);
    app.get('/api/v:version/profile', user.getProfile);
    app.post('/api/v:version/close/:id', user.closeTo);
    app.post('/api/v:version/profile/info', user.goCompany1);
    app.get('/api/v:version/profile/data', user.listData);
    app.post('/api/v:version/profile/data/new', user.recData);
    app.post('/api/v:version/profile/update', user.updateUser);
    app.post('/api/v:version/user/create', user.regUser);
    app.post('/api/v:version/profile/token/new', user.newToken);
    app.delete('/api/v:version/profile/token', user.removeToken);
    app.post('/api/v:version/profile/restore-token', user.restoreToken);
    app.post('/api/v:version/oauth/new', user.createOAuth);
    app.delete('/api/v:version/oauth/:id', user.removeOAuth);
    app.get('/api/v:version/eid', user.prepGoCompany9);
    app.post('/api/v:version/eid/callback', body.urlencoded({extended: true}));
    app.post('/api/v:version/eid/callback', user.goCompany9);
    app.get('/api/v:version/eid/bce/:bce', user.goBCE);
    //------
    app.get('/api/v:version/data/:id', data.getData);
    app.get('/api/v:version/data/trigger/:data_name', data.triggerVaults);
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
    if(utils.DEBUG == false) {
        process.on('uncaughtException', function(err) {
            console.log(err);
        });
    }

    if(isHttps == 'true') {
        var servers = https.createServer({key: fs.readFileSync(__dirname + '/whigi-key.pem'), cert: fs.readFileSync(__dirname + '/whigi-cert.pem')}, app);
        servers.listen(httpport);
    } else {
        var server = http.createServer(app);
        server.listen(httpport);
    }
    console.log('Booststrap finished.'); 
});