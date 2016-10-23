/**
 * API dealing with giveways, lauching a new WP.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var ndm = require('nodemailer');
var https = require('https');
var hash = require('js-sha256');
var aes = require('aes-js');
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var utils = require('../utils/utils');
var mailer, rsa_key;

/**
 * Sets up the mailer before use.
 * @function managerInit
 * @public
 */
export function managerInit() {
    mailer = ndm.createTransport({
        service: 'Gmail',
        auth: {
            user: 'whigi.com@gmail.com',
            pass: 'nNP36gFYmMeND3dIoKwR'
        }
    });
    rsa_key = '';
}

/**
 * Sends a request to Whigi
 * @function whigi
 * @private
 * @param {String} method Method.
 * @param {String} path End point.
 * @param {Object} data Data.
 * @return {Promise} Promise.
 */
function whigi(method: string, path: string, data?: any): Promise {
    var options = {
        host: utils.WHIGIHOST,
        port: 443,
        path: path,
        method: method,
        headers: {
            'Authorization': 'Basic ' + new Buffer('whigi-gwp:' + hash.sha256(require('./password.json').pwd)).toString('base64')
        }
    };
    if(method == 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    return new Promise(function(resolve, reject) {
        var ht = https.request(options, function(res) {
            var r = '';
            res.on('data', function(chunk) {
                r += chunk;
            });
            res.on('end', function() {
                resolve(JSON.parse(r));
            });
        }).on('error', function(err) {
            reject(err);
        });
        if(method == 'POST')
            ht.write(data);
        ht.end();
    });
}

/**
 * Decrypt a string using master_key in AES.
 * @function decryptAES
 * @public
 * @param {String} data Data to decrypt.
 * @param {Bytes} key Key to use.
 * @return {String} Result.
 */
function decryptAES(data: string, key: number[]): string {
    return aes.util.convertBytesToString(new aes.ModeOfOperation.ctr(key, new aes.Counter(0)).decrypt(utils.str2arr(data)));
}

/**
 * Decrypt a vault and return its contents.
 * @function decryptVault
 * @private
 * @param {Object} profile My profile.
 * @param {String} user User id.
 * @param {String} name Name.
 * @return {Promise} Data.
 */
function decryptVault(profile: any, user: string, name: string): Promise {
    return new Promise(function(resolve, reject) {
        if(!!profile.shared_with_me[user] && !!profile.shared_with_me[user][name]) {
            whigi('GET', '/api/v1/vault/' + profile.shared_with_me[user][name]).then(function(vault) {
                try {
                    var aesKey: number[] = utils.decryptRSA(vault.aes_crypted_shared_pub, rsa_key);
                    vault.decr_data = decryptAES(vault.data_crypted_aes, aesKey);
                    resolve(vault);
                } catch(e) {
                    reject(e);
                }
            }, function(e) {
                reject(e);
            });
        } else {
            reject('Not shared');
        }
    });
}

/**
 * Creates a challenge for logging in.
 * @function challenge
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function challenge(req, res) {
    req.session.challenge = utils.generateRandomString(4);
    res.type('application/json').status(200).json({challenge: req.session.challenge});
}

/**
 * Creates a new mapping if not one already.
 * @function create
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
export function create(req, res) {
    var response: string = req.query.r64;
    var id: string = req.query.user.toLowerCase();
    var lid: string = encodeURIComponent(id);

    whigi('GET', '/api/v1/profile').then(function(user) {
        if(rsa_key == '') {
            try {
                var key = utils.toBytes(hash.sha256(require('./password.json').pwd + user.salt));
                var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
                var master_key = Array.from(decrypter.decrypt(user.encr_master_key));
                decrypter = new aes.ModeOfOperation.ctr(master_key, new aes.Counter(0));
                rsa_key = aes.util.convertBytesToString(decrypter.decrypt(user.rsa_pri_key[0]));
            } catch(e) {
                console.log('Cannot decrypt our keys.');
                res.redirect('/error.html');
            }
        }

        whigi('GET', '/api/v1/profile/data').then(function(data) {
            user.data = data.data;
            user.shared_with_me = data.shared_with_me;
            decryptVault(user, id, 'keys/auth/whigi-gwp').then(function(vault) {
                var resp: string = utils.atob(response);
                var nc = decryptAES(resp, utils.toBytes(vault.decr_data));
                if(nc == req.session.challenge) {
                    //Check if exists
                    fs.access('/var/www/' + lid, function(err) {
                        if(!!err) {
                            //Continue
                            var httpsport = Math.floor(Math.random() * (65535 - 1025)) + 1025;
                            decryptVault(user, id, 'profile/email').then(function(vault2) {
                                var email = vault2.decr_data;
                                fs.writeFile('/etc/nginx/sites-available/' + lid, `
                                    server {
                                            listen 443;
                                            server_name  ` + lid + `.envict.com;
                                            error_log /home/gregoire/nginx.err;
                                            access_log  /home/gregoire/nginx.log;
                                            gzip on;
                                            gzip_min_length 1000;
                                            gzip_proxied any;
                                            gzip_comp_level 7;
                                            gzip_types *;
                                            location / {
                                                    proxy_pass      https://localhost:` + httpsport + `;
                                                    proxy_set_header    Host            $host;
                                                    proxy_set_header    X-Real-IP       $remote_addr;
                                                    proxy_set_header    X-Forwarded-for $remote_addr;
                                                    port_in_redirect on;
                                            }
                                    }
                                `, function(e) {
                                    if(e) {
                                        console.log('Cannot write file.');
                                        res.redirect('/error.html');
                                    } else {
                                        fs.writeFile('/etc/apache2/sites-available/' + lid + '.conf', `
                                            <VirtualHost *:` + httpsport + `>
                                                SSLEngine On
                                                SSLCertificateFile /home/gregoire/envict.bundle.crt
                                                SSLCertificateKeyFile /home/gregoire/envict.com.key
                                                ServerName ` + lid + `.envict.com
                                                ServerAdmin whigi.com@gmail.com
                                                DocumentRoot /var/www/` + lid + `
                                                ErrorLog \${APACHE_LOG_DIR}/error.log
                                                CustomLog \${APACHE_LOG_DIR}/access.log combined
                                            </VirtualHost>
                                        `, function(e) {
                                            if(e) {
                                                console.log('Cannot write file.');
                                                remove(req, {}, false);
                                                res.redirect('/error.html');
                                            } else {
                                                fs.writeFile('/home/gregoire/wordpress/wp-config.php', `
                                                    <?php
                                                        define('DB_NAME', '` + lid + `');
                                                        define('DB_USER', 'wpshit');
                                                        define('DB_PASSWORD', 'shitty');
                                                        define('DB_HOST', 'localhost');
                                                        define('DB_CHARSET', 'utf8mb4');
                                                        define('DB_COLLATE', '');
                                                        define('AUTH_KEY',         'Jh5I7@7m2OB~HiNSc1}/~s209Z]Nf?.uTv+B}lIpbXzUcs(R*xxn|@lX9VTfA5!o');
                                                        define('SECURE_AUTH_KEY',  'iACos2^0]3+} Mc]N[u/Nf)s1{k|#Q&S%3[6m7InZCmvCFoN2)m+-K[< PpEN7>q');
                                                        define('LOGGED_IN_KEY',    'XD?uYc4%5i+^/Mf!-D0E81GhJ&FfVztoih_M!E D.u+PGX3pk?U.r*JmlLFwboF=');
                                                        define('NONCE_KEY',        '*4+=G<H_MXdr@4-^+oMRmq>k:Oq4gc({->B[l1yJIzPH eAmnLamMFN_?<VzDK6m');
                                                        define('AUTH_SALT',        'K!o$1hATCF9H3Ywq%{O4=G>|3V-%OCb OLJ2ejKlm1RpdABTAlnxf&1])e^$kwL[');
                                                        define('SECURE_AUTH_SALT', 'mp*60}n4vFwzlNA/b<F[ikBlRxM2~yqo~7rx[3d5%S42gd^Y=*Nd4~#K3J!u<BmJ');
                                                        define('LOGGED_IN_SALT',   '7jFxLyq%.uF&5~g2g+M /lWy#2kl-xRRm!}Yegg^X9=xw&ALH>u3I|Cr|cc=G$tL');
                                                        define('NONCE_SALT',       '[i|_-]%Tq1D^<[!P|}fIDZJttmax{}flkW?Ma+m9h%wh2K>B&jPlAr4c<=-S_C?L');
                                                        $table_prefix  = 'wp_';
                                                        define('WP_DEBUG', false);
                                                        define('WP_DEBUG_LOG', false);
                                                        define('DISABLE_WP_CRON', 'true');
                                                        define('FORCE_SSL_ADMIN', true);
                                                        if ( !defined('ABSPATH') )
                                                                define('ABSPATH', dirname(__FILE__) . '/');
                                                        require_once(ABSPATH . 'wp-settings.php');
                                                    ?>
                                                `, function(e) {
                                                    if(e) {
                                                        console.log('Cannot write file.');
                                                        remove(req, {}, false);
                                                        res.redirect('/error.html');
                                                    } else {
                                                        var mode = (!!req.params.wptype)? req.params.wptype : 'classic';
                                                        var plgs;
                                                        switch(mode) {
                                                            case 'selling':
                                                                plgs = 'whigi-wp wp-force-https ckeditor-for-wordpress seo-ultimate wordpress-seo wptouch cmb2 kirki woorcommerce woocommerce-gateway-paypal-express-checkout woocommerce-shortcodes yith-woocommerce-wishlist';
                                                                break;
                                                            case 'classic':
                                                            default:
                                                                plgs = 'whigi-wp wp-force-https ckeditor-for-wordpress seo-ultimate wordpress-seo wptouch';
                                                                break;
                                                        }
                                                        exec(`
                                                            mysql -u root -p` + require('./password.json').pwd + ` -e "DROP DATABASE IF EXISTS ` + lid + `;" &&
                                                            mysql -u root -p` + require('./password.json').pwd + ` -e "CREATE DATABASE ` + lid + `;" &&
                                                            rm -f /etc/nginx/sites-enabled/` + lid + ` &&
                                                            ln -s /etc/nginx/sites-available/` + lid + ` /etc/nginx/sites-enabled/` + lid + ` &&
                                                            rm -f /etc/apache2/sites-enabled/` + lid + `.conf &&
                                                            ln -s /etc/apache2/sites-available/` + lid + `.conf /etc/apache2/sites-enabled/` + lid + `.conf &&
                                                            echo "Listen ` + httpsport + ` https" >> /etc/apache2/ports.conf &&
                                                            service apache2 reload &&
                                                            rm -rf /var/www/` + lid + ` &&
                                                            mkdir /var/www/` + lid + ` &&
                                                            cp -r /home/gregoire/wordpress/* /var/www/` + lid + `/ &&
                                                            chmod -R 770 /var/www/` + lid + `/ &&
                                                            chown -hR www-data:www-data /var/www/` + lid + `/ &&
                                                            wp --allow-root --path=/var/www/` + lid + ` core install --url=https://` + lid + `.envict.com --admin_user=whigi-gwp --admin_email=whigi.com@gmail.com --admin_password=` + utils.generateRandomString(20) + ` --title=` + id + ` --skip-email &&
                                                            wp --allow-root --path=/var/www/` + lid + ` plugin activate ` + plgs + ` &&
                                                            wp --allow-root --path=/var/www/` + lid + ` theme activate clean-lite
                                                        `, function(err, stdout, stderr) {
                                                            if(err) {
                                                                console.log('Cannot complete OPs:\n' + stderr);
                                                                remove(req, {}, false);
                                                                res.redirect('/error.html');
                                                            } else {
                                                                res.redirect('https://' + lid + '.envict.com/wp-login.php');
                                                                exec('service nginx force-reload');
                                                                setTimeout(function() {
                                                                    exec('wp --allow-root --path=/var/www/' + lid + ' plugin deactivate whigi-wp', function() {
                                                                        setTimeout(function() {
                                                                            exec('wp --allow-root --path=/var/www/' + lid + ' plugin activate whigi-wp', function() {
                                                                                exec('wp --allow-root --path=/var/www/' + lid + ' plugin deactivate whigi-wp-s2', function() {
                                                                                    setTimeout(function() {
                                                                                        exec('wp --allow-root --path=/var/www/' + lid + ' plugin activate whigi-wp-s2');
                                                                                    }, 300);
                                                                                });
                                                                            });
                                                                        }, 300);
                                                                    });
                                                                }, 300);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }, function(e) {
                                console.log('Cannot read email.', e);
                                res.redirect('/error.html');
                            });
                        } else {
                            //Account already existed
                            res.redirect('/success.html#' + encodeURIComponent('https://' + lid + '.envict.com'));
                        }
                    });
                } else {
                    console.log('Challenge was ' + req.session.challenge + ' but read ' + nc + ' for user ' + id + '.');
                    res.redirect('/error.html');
                }
            }, function(e) {
                console.log('Cannot read response.');
                res.redirect('/error.html');
            });
        }, function(e) {
            console.log('Cannot read data.');
            res.redirect('/error.html');
        });
    }, function(e) {
        console.log('Cannot read profile.');
        res.redirect('/error.html');
    });
}

/**
 * Removes a mapping if any.
 * @function remove
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Boolean} respond Whether to respond.
 */
export function remove(req, res, respond?: boolean) {
    var response: string = req.query.r64;
    var id: string = req.query.user;
    var lid: string = encodeURIComponent(id.toLowerCase());
    respond = respond !== false;

    whigi('GET', '/api/v1/profile').then(function(user) {
        if(rsa_key == '') {
            try {
                var key = utils.toBytes(hash.sha256(require('./password.json').pwd + user.salt));
                var decrypter = new aes.ModeOfOperation.ctr(key, new aes.Counter(0));
                var master_key = Array.from(decrypter.decrypt(user.encr_master_key));
                decrypter = new aes.ModeOfOperation.ctr(master_key, new aes.Counter(0));
                rsa_key = aes.util.convertBytesToString(decrypter.decrypt(user.rsa_pri_key[0]));
            } catch(e) {
                console.log('Cannot decrypt our keys.');
                if(respond === true)
                    res.redirect('/error.html');
            }
        }

        whigi('GET', '/api/v1/profile/data').then(function(data) {
            user.data = data.data;
            user.shared_with_me = data.shared_with_me;
            decryptVault(user, id, 'keys/auth/whigi-gwp').then(function(vault) {
                var resp: string = utils.atob(response);
                var nc = decryptAES(resp, utils.toBytes(vault.decr_data));
                if(nc == req.session.challenge || respond !== true) {
                    exec(`
                        mysql -u root -p` + require('./password.json').pwd + ` -e "DROP DATABASE IF EXISTS ` + lid + `;" &&
                        rm -f /etc/nginx/sites-enabled/` + lid + ` &&
                        rm -f /etc/apache2/sites-enabled/` + lid + `.conf &&
                        service apache2 reload &&
                        rm -rf /var/www/` + lid + ` 
                    `, function(err, stdout, stderr) {
                        if(err) {
                            console.log('Cannot complete OPs:\n' + stderr);
                            if(respond === true)
                                res.redirect('/error.html');
                        } else {
                            if(respond === true)
                                res.redirect('/removed.html');
                            exec('service nginx force-reload');
                        }
                    });
                } else {
                    console.log('Challenge was ' + req.session.challenge + ' but read ' + nc + ' for user ' + id + '.');
                    if(respond === true)
                        res.redirect('/error.html');
                }
            }, function(e) {
                console.log('Cannot read response.');
                if(respond === true)
                    res.redirect('/error.html');
            });
        }, function(e) {
            console.log('Cannot read data.');
            if(respond === true)
                res.redirect('/error.html');
        });
    }, function(e) {
        console.log('Cannot read profile.');
        if(respond === true)
            res.redirect('/error.html');
    });
}