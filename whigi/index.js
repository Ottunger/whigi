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
var mc = require('mongodb').MongoClient;
var pki = require('node-forge').pki;
var BS = require('passport-http').BasicStrategy;
var TS = require('passport-token-auth');
var utils = require('../utils/utils');
var checks = require('../utils/checks');
var user = require('./user');
var data = require('./data');
var datasources = require('../common/Datasource');
var db, rpem;

//Set the running configuration
//Launch as ">$ node index.js localhost" for instance
var configs = require('./configs.json');
var config = configs[process.argv[2]];
var httpport = config.port;
var localhost = config.localhost;
utils.RESTOREHOST = config.restorehost; 
utils.RUNNING_ADDR = 'https://' + localhost;
utils.MAIL_ADDR = config.mail;
utils.DEBUG = config.debug;
utils.ENDPOINTS = config.endpoints;
utils.DEBUG_PPL = config.debug_ppl;
if(utils.DEBUG)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Returns the allowed HTTP vers on a ressource.
 * @function listOptions
 * @private
 * @param {String} path The path.
 * @param {Response} res The response.
 * @param {Function} next 404 Handler.
 */
function listOptions(path, res, next) {
    if(path.match(/\/api\/v[1-9]\/generics(_paths)?.json\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/schemas\/[a-zA-Z0-9%]+\/[0-9]+\/[0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/helps\/[a-zA-Z0-9%_\.]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/peek\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/user\/create\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/close\/check\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/close\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/info[2-3]?\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/discard\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/data\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/user\/.+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/update\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/profile\/uname\/?$/))
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
    else if(path.match(/\/api\/v[1-9]\/nominatim\/.+\.php?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/payed\/[a-zA-Z0-9%_]+\/[a-zA-Z0-9%\-]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/payed\/init\/begin\/[a-zA-Z0-9%\-]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    //-----
    else if(path.match(/\/api\/v[1-9]\/data\/[a-zA-Z0-9%\-]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,POST,DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/data\/byname\/[^\/]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/data\/[a-zA-Z0-9%_\-]+\/to\/[a-zA-Z0-9%_\-]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/data\/trigger\/[a-zA-Z0-9%_\-]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/link\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/new\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET,POST,DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/forother\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'DELETE').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/time\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/vault\/whoto\/.+\/[a-zA-Z0-9%\-]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/any\/[a-zA-Z0-9]+\/[a-z]+\/[a-zA-Z0-9]+\/?$/))
        res.set('Access-Control-Allow-Methods', 'GET').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/any\/remove\/?$/))
        res.set('Access-Control-Allow-Methods', 'POST').type('application/json').status(200).json({error: ''});
    else if(path.match(/\/api\/v[1-9]\/ask\/?$/))
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
    mc.connect('mongodb://localhost:27017/whigi', function(err, d) {
        if(!err) {
            db = new datasources.Datasource(d, config.mount, true, false);
            rpem = pki.certificateFromPem(fs.readFileSync(__dirname + '/whigi-cert.pem'));
            user.managerInit(db, config);
            data.managerInit(db, config);
            checks.prepareRL();
            callback(false);
        } else {
            callback(true);
        }
    });
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
    db.retrieveUser(username.toLowerCase(), []).then(function(user) {
        if(!!user && !user.company_info.is_closed) {
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
        db.retrieveUser(ticket.bearer_id, []).then(function(user) {
            if(!!user && !user.company_info.is_closed) {
                if(is_token) {
                    ticket.last_refresh = (new Date).getTime();
                    ticket.persist();
                } else {
                    user.impersonated_prefix = ticket.prefix;
                    user.oauth_admin = ticket._id.substr(0, 5) == 'admin';
                }
                return done(null, user);
            } else {
                return done(true);
            }
        }, function(e) {
            return done(e);
        });
    }

    db.retrieveToken({_id: token}).then(function(ticket) {
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

/**
 * Chunks the string.
 * @fucntion chunk
 * @public
 * @param {String} str Input.
 * @param {Number} n Break.
 * @return {String[]} Chunks.
 */
function chunk(str, n) {
    var ret = [], i, len;
    for(i = 0, len = str.length; i < len; i += n) {
        ret.push(str.substr(i, n))
    }
    return ret
};

/**
 * Is the first middleware for passport.
 * @function pauth
 * @public
 * @param {Request} req Request.
 * @param {Response} res Response.
 * @param {Function} next Middleware.
 */
function pauth(req, res, next) {
    var cert;
    if(!!req.get('X-SSL-CERT')) {
        var t = '-----BEGIN CERTIFICATE-----\n' + chunk(req.get('X-SSL-CERT'), 64).join('\n') + '\n-----END CERTIFICATE-----';
    } else if(config.https) {
        var t = '-----BEGIN CERTIFICATE-----\n' + chunk((req.socket.getPeerCertificate().raw || '').toString('base64'), 64).join('\n') + '\n-----END CERTIFICATE-----';
    }
    try {
        cert = pki.certificateFromPem(t);
    } catch(e) {}
    if(!!cert) {
        var ok = false;
        try {
            ok = rpem.verify(cert);
        } catch(e) {}
        if(!ok) {
            if(req.perm !== true) {
                res.type('application/json').status(418).json({error: utils.i18n('client.auth', req)});
                return;
            } else {
                next();
            }
        }
        var id = cert.subject.getField('CN').value;
        db.retrieveUser(id, []).then(function(user) {
            if(!!user && !user.company_info.is_closed) {
                req.user = user;
                next();
            } else {
                if(req.perm !== true)
                    res.type('application/json').status(418).json({error: utils.i18n('client.auth', req)});
                else
                    next();
            }
        }, function(e) {
            if(req.perm !== true)
                res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
            else
                next();
        });
    } else {
        pass.authenticate(['token', 'basic'], function(err, user, info) {
            if(err) {
                if(req.perm !== true)
                    res.type('application/json').status(500).json({error: utils.i18n('internal.db', req)});
                else
                    next();
            } else if(!user) {
                if(req.perm !== true)
                    res.type('application/json').status(418).json({error: utils.i18n('client.auth', req)});
                else
                    next();
            } else {
                req.user = user;
                next();
            }
        })(req, res, next);
    }
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
            res.set('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, x-whigi-authorization, X-Requested-With');
            next();
        });
    }
    app.use(function(req, res, next) {
        if(!!req.body)
            req.bodylength = Buffer.byteLength(req.body, 'utf8');
        next();
    });
    app.use(body.json({limit: '5000mb'}));

    app.get('/api/v:version/generics.json', function(req, res) {
        res.type('application/json').status(200).json(require('./generics.json'));
    });
    app.get('/api/v:version/generics_paths.json', function(req, res) {
        res.type('application/json').status(200).json(require('./generics_paths.json'));
    });
    app.get('/api/v:version/schemas/:name/:v1/:v2', function(req, res) {
        res.type('application/json').status(200).json(require('./schemas/' + encodeURIComponent(req.params.name) + '_' + req.params.v1 + '_' + req.params.v2 + '.json'));
    });
    app.get('/api/v:version/selects/:key', function(req, res) {
        res.type('application/json').status(200).json(require('./selects/' + req.params.key + '.json'));
    });
    app.get('/api/v:version/helps/:key', function(req, res) {
        res.type('application/json').status(200).json(require('./helps/' + req.params.key + '.json'));
    });
    //Need to copy Authorization header
    app.use(function(req, res, next) {
        if(!!req.headers['x-whigi-authorization'])
            req.headers['authorization'] = req.headers['x-whigi-authorization'];
        next();
    });
    //API AUTH DECLARATIONS
    app.get('/api/v:version/user/:id', pauth);
    app.get('/api/v:version/profile', pauth);
    app.get('/api/v:version/close/check/:id', pauth);
    app.post('/api/v:version/close/:id', pauth);
    app.delete('/api/v:version/profile', pauth);
    app.post('/api/v:version/profile/info', pauth);
    app.post('/api/v:version/profile/info2', pauth);
    app.post('/api/v:version/profile/info3', pauth);
    app.get('/api/v:version/profile/data', pauth);
    app.post('/api/v:version/profile/data', pauth);
    app.post('/api/v:version/profile/data/discard', pauth);
    app.post('/api/v:version/profile/data/new', pauth);
    app.post('/api/v:version/profile/update', pauth);
    app.post('/api/v:version/profile/uname', pauth);
    app.post('/api/v:version/user/create', function(req, res, next) {req.perm = true; pauth(req, res, next);});
    app.post('/api/v:version/profile/token/new', pauth);
    app.delete('/api/v:version/profile/token', pauth);
    app.get('/api/v:version/eid/bce/:bce', pauth);
    app.post('/api/v:version/profile/restore-token', pauth);
    app.post('/api/v:version/oauth/new', pauth);
    app.delete('/api/v:version/oauth/:id', pauth);
    app.post('/api/v:version/nominatim/:php', pauth);
    app.post('/api/v:version/payed/:for/:pid', pauth);
    app.get('/api/v:version/payed/init/begin/:for', pauth);
    //-----
    app.get('/api/v:version/data/:id', pauth);
    app.post('/api/v:version/data/:id', pauth);
    app.get('/api/v:version/data/byname/:name', pauth);
    app.get('/api/v:version/data/:name/to/:now', pauth);
    app.get('/api/v:version/data/trigger/:data_name', pauth);
    app.delete('/api/v:version/data/:data_name', pauth);
    app.post('/api/v:version/vault/link', pauth);
    app.post('/api/v:version/vault/new', pauth);
    app.delete('/api/v:version/vault/:vault_id', pauth);
    app.delete('/api/v:version/vault/forother/:vault_id', pauth);
    app.get('/api/v:version/vault/:vault_id', pauth);
    app.post('/api/v:version/vault/:vault_id', pauth);
    app.get('/api/v:version/vault/time/:vault_id', pauth);
    app.get('/api/v:version/any/:collection/:id', pauth);
    app.post('/api/v:version/any/remove', pauth);
    app.post('/api/v:version/ask', pauth);
    //API LIMITATIONS FOR OAUTH
    app.get('/api/v:version/close/check/:id', checks.checkOAuth(true));
    app.post('/api/v:version/close/:id', checks.checkOAuth(true));
    app.delete('/api/v:version/profile', checks.checkOAuth(true));
    app.post('/api/v:version/profile/info', checks.checkOAuth(true));
    app.post('/api/v:version/profile/info2', checks.checkOAuth(true));
    app.post('/api/v:version/profile/info3', checks.checkOAuth(true));
    app.post('/api/v:version/profile/data/new', checks.checkOAuth(false, 1));
    app.post('/api/v:version/profile/update', checks.checkOAuth(true));
    app.post('/api/v:version/profile/uname', checks.checkOAuth(true));
    app.post('/api/v:version/profile/token/new', checks.checkOAuth(true));
    app.delete('/api/v:version/profile/token', checks.checkOAuth(true));
    app.get('/api/v:version/eid/bce/:bce', checks.checkOAuth(true));
    //-----
    app.get('/api/v:version/data/:id', checks.checkOAuth(false, 0));
    app.post('/api/v:version/data/:id', checks.checkOAuth(false, 0));
    app.get('/api/v:version/data/byname/:name', checks.checkOAuth(false, 3));
    app.get('/api/v:version/data/:name/to/:now', checks.checkOAuth(true));
    app.delete('/api/v:version/data/:data_name', checks.checkOAuth(true));
    app.post('/api/v:version/vault/link', checks.checkOAuth(false, 2));
    app.post('/api/v:version/vault/new', checks.checkOAuth(false, 2));
    app.delete('/api/v:version/vault/:vault_id', checks.checkOAuth(true));
    app.delete('/api/v:version/vault/forother/:vault_id', checks.checkOAuth(true));
    app.get('/api/v:version/vault/time/:vault_id', checks.checkOAuth(false, 0));
    app.post('/api/v:version/oauth/new', checks.checkOAuth(false, 4));
    app.delete('/api/v:version/oauth/:id', checks.checkOAuth(false, 4));
    app.post('/api/v:version/ask', checks.checkOAuth(true));
    //API POST CHECKS
    app.post('/api/v:version/close/:id', checks.checkBody(['new_keys']));
    app.post('/api/v:version/profile/info2', checks.checkBody(['request']));
    app.post('/api/v:version/profile/info3', checks.checkBody(['lang']));
    app.post('/api/v:version/profile/data', checks.checkBody(['maybe_stale', 'needed']));
    app.post('/api/v:version/profile/data/discard', checks.checkBody(['discard']));
    app.post('/api/v:version/profile/data/new', checks.checkBody(['name', 'encr_data', 'is_dated', 'version', 'is_bound', 'encr_aes']));
    app.post('/api/v:version/profile/update', checks.checkBody(['new_password', 'encr_master_key', 'sha_master']));
    app.post('/api/v:version/profile/uname', checks.checkBody(['new_username']));
    app.post('/api/v:version/user/create', checks.checkBody(['username', 'password', 'public_key', 'private_key']));
    app.post('/api/v:version/user/ack', checks.checkBody(['username', 'public_pem']));
    app.post('/api/v:version/profile/token/new', checks.checkBody(['is_eternal']));
    app.post('/api/v:version/profile/restore-token', checks.checkBody(['token_id', 'bearer_id']));
    app.post('/api/v:version/oauth/new', checks.checkBody(['for_id', 'prefix']));
    app.post('/api/v:version/payed/:for/:pid', checks.checkBody(['payer_id']));
    //-----
    app.post('/api/v:version/vault/link', checks.checkBody(['vault_id', 'data_name']));
    app.post('/api/v:version/vault/new', checks.checkBody(['data_name', 'shared_to_id', 'aes_crypted_shared_pub', 'data_crypted_aes', 'expire_epoch', 'trigger', 'real_name', 'version']));
    //app.post('/api/v:version/any/remove', checks.checkBody(['collection', 'id', 'payload']));
    app.post('/api/v:version/ask', checks.checkBody(['list', 'expire', 'trigger', 'towards']));
    //API LONG LIVED COMMANDS
    app.get('/api/v:version/close/check/:id', checks.checkPuzzle);
    app.post('/api/v:version/close/:id', checks.checkPuzzle);
    app.post('/api/v:version/profile/data/discard', checks.checkPuzzle);
    app.post('/api/v:version/profile/data/new', checks.checkPuzzle);
    app.post('/api/v:version/profile/token/new', checks.checkPuzzle);
    //-----
    app.get('/api/v:version/data/:name/to/:now', checks.checkPuzzle);
    app.post('/api/v:version/vault/link', checks.checkPuzzle);
    app.post('/api/v:version/vault/new', checks.checkPuzzle);
    app.post('/api/v:version/ask', checks.checkPuzzle);
    //API ROUTES
    app.get('/api/v:version/peek/:id', user.peekUser);
    app.get('/api/v:version/user/:id', user.getUser);
    app.get('/api/v:version/profile', user.getProfile);
    app.get('/api/v:version/close/check/:id', user.canClose);
    app.post('/api/v:version/close/:id', user.closeTo);
    app.delete('/api/v:version/profile', user.remUser);
    app.post('/api/v:version/profile/info', user.goCompany1);
    app.post('/api/v:version/profile/info2', user.setRequests);
    app.post('/api/v:version/profile/info3', user.setLang);
    app.get('/api/v:version/profile/data', user.listData);
    app.post('/api/v:version/profile/data', user.someData);
    app.post('/api/v:version/profile/data/discard', user.contData);
    app.post('/api/v:version/profile/data/new', user.recData);
    app.post('/api/v:version/profile/update', user.updateUser);
    app.post('/api/v:version/profile/uname', user.changeUsername);
    app.post('/api/v:version/user/create', user.regUser);
    app.post('/api/v:version/user/ack', user.regUserDummy);
    app.post('/api/v:version/profile/token/new', user.newToken);
    app.delete('/api/v:version/profile/token', user.removeToken);
    app.post('/api/v:version/profile/restore-token', user.restoreToken);
    app.post('/api/v:version/oauth/new', user.createOAuth);
    app.delete('/api/v:version/oauth/:id', user.removeOAuth);
    app.get('/api/v:version/eid', user.prepGoCompany9);
    app.post('/api/v:version/eid/callback', body.urlencoded({extended: true}));
    app.post('/api/v:version/eid/callback', user.goCompany9);
    app.get('/api/v:version/eid/bce/:bce', user.goBCE);
    app.post('/api/v:version/nominatim/:php', user.nominatim);
    app.post('/api/v:version/payed/:for/:pid', user.payed);
    app.get('/api/v:version/payed/init/begin/:for', user.pay);
    //------
    app.get('/api/v:version/data/:id', data.getData);
    app.post('/api/v:version/data/:id', data.getData);
    app.get('/api/v:version/data/byname/:name', data.getDataByName);
    app.get('/api/v:version/data/:name/to/:now', data.renameData);
    app.get('/api/v:version/data/trigger/:data_name', data.triggerVaults);
    app.delete('/api/v:version/data/:data_name', data.removeData);
    app.post('/api/v:version/vault/link', data.linkVault);
    app.post('/api/v:version/vault/new', data.regVault);
    app.delete('/api/v:version/vault/:vault_id', data.removeVault);
    app.delete('/api/v:version/vault/forother/:vault_id', data.removeStorable);
    app.get('/api/v:version/vault/:vault_id', data.getVault);
    app.post('/api/v:version/vault/:vault_id', data.getVault);
    app.get('/api/v:version/vault/time/:vault_id', data.accessVault);
    app.get('/api/v:version/vault/whoto/:id/:name', data.whoTo);
    app.get('/api/v:version/any/:collection/:id', data.getAny);
    app.post('/api/v:version/any/remove', data.removeAny);
    app.post('/api/v:version/ask', data.askGrants);

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
            console.log(err, err.stack);
        });
    }

    if(config.https) {
        var servers = https.createServer({
            key: fs.readFileSync(config.keypem),
            cert: fs.readFileSync(config.certpem),
            ca: fs.readFileSync(__dirname + '/whigi-cert.pem'),
            requestCert: true,
            rejectUnauthorized: false
        }, app);
        servers.listen(httpport);
    } else {
        var server = http.createServer(app);
        server.listen(httpport);
    }
    console.log('Booststrap finished.'); 
});