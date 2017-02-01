/**
 * Description of a user.
 * @module User
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256');
var utils = require('../../utils/utils');
import {Datasource} from '../Datasource';
import {IModel} from './IModel';

export var fields = {
    is_company: true,
    company_info: true,
    password: true,
    salt: true,
    _id: true,
    puzzle: true,
    encr_master_key: true,
    rsa_pub_key: true,
    rsa_pri_key: true,
    data: true,
    shared_with_me: true,
    oauth: true,
    sha_master: true,
    cert: true,
    hidden_id: true
}

interface More {
    _id: string;
    trigram: string;
    values: {[id: string]: {[id: string]: string}};
}

export class User extends IModel {

    public is_company: number;
    public company_info: any;
    public password: string;
    public salt: string;
    public puzzle: string;
    public encr_master_key: string;
    public rsa_pub_key: string;
    public rsa_pri_key: number[][];
    public data: any;
    public shared_with_me: {[id: string]: {[id: string]: string}};
    public oauth: any[];
    public sha_master: string;
    public cert: string;
    public hidden_id: string;
    public impersonated_prefix: string;
    public oauth_admin: boolean;
    private trigrams: {[id: string]: More};
    static trgs: string[];
    
    /**
     * Create a User from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(u, db: Datasource) {
        super(u._id, db);
        if('is_company' in u)
            this.is_company = u.is_company;
        if('company_info' in u)
            this.company_info = u.company_info;
        if('password' in u)
            this.password = u.password;
        if('salt' in u)
            this.salt = u.salt;
        if('puzzle' in u)
            this.puzzle = u.puzzle;
        if('encr_master_key' in u)
            this.encr_master_key = u.encr_master_key;
        if('rsa_pub_key' in u)
            this.rsa_pub_key = u.rsa_pub_key;
        if('rsa_pri_key' in u)
            this.rsa_pri_key = u.rsa_pri_key;
        if('data' in u)
            this.data = u.data;
        if('shared_with_me' in u)
            this.shared_with_me = u.shared_with_me;
        if('oauth' in u)
            this.oauth = u.oauth;
        if('sha_master' in u)
            this.sha_master = u.sha_master;
        if('cert' in u)
            this.cert = u.cert;
        if('hidden_id' in u)
            this.hidden_id = u.hidden_id;
        this.oauth_admin = false;
        this.trigrams = {};
    }

    /**
     * Merge fields of upt into the object. Manages the key updates involved.
     * @function applyUpdate
     * @public
     * @param upt The update.
     */
    applyUpdate(upt) {
        if('new_password' in upt && 'encr_master_key' in upt && 'sha_master' in upt) {
            this.password = hash.sha256(upt.new_password + this.salt);
            this.encr_master_key = upt.encr_master_key;
            this.sha_master = upt.sha_master;
        }
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @public
     * @return Duplicated object.
     */
    allFields() {
        var ret = {
            is_company: this.is_company,
            company_info: this.company_info,
            password: this.password,
            salt: this.salt,
            _id: this._id,
            puzzle: this.puzzle,
            encr_master_key: this.encr_master_key,
            rsa_pub_key : this.rsa_pub_key,
            rsa_pri_key: this.rsa_pri_key,
            data: this.data,
            shared_with_me: this.shared_with_me,
            oauth: this.oauth,
            sha_master: this.sha_master,
            cert: this.cert,
            hidden_id: this.hidden_id
        };
        return ret;
    }

    /**
     * Fills the data in a user if not already done.
     * @function fill
     * @public
     * @param {Array} names Names to add for split shares.
     * @param {Boolean} full Force completely full.
     * @return A promise when ready.
     */
    fill(names?: string[], full?: boolean) {
        var self = this;
        names = names || [];

        return new Promise(function(resolve, reject) {
            function populate(names: string[]) {
                var needed = {}, keys: string[], done = 0;
                if(full !== true) {
                    for(var i = 0; i < names.length; i++)
                        needed[names[i].substr(0, 3)] = true;
                    keys = Object.getOwnPropertyNames(needed);
                } else {
                    keys = User.trgs;
                }
                for(var i = 0; i < keys.length; i++) {
                    if(keys[i] in self.shared_with_me['whigi-system']) {
                        self.db.retrieveGeneric('users', {_id: self.shared_with_me['whigi-system'][keys[i]]}, {none: false}).then(function(add: More) {
                            Object.assign(self.shared_with_me, add.values);
                            self.trigrams[add.trigram] = add;
                            done++;
                            if(done >= keys.length)
                                resolve();
                        }, function(e) {
                            done++;
                            if(done >= keys.length)
                                resolve();
                        });
                    } else {
                        done++;
                        if(done >= keys.length)
                            resolve();
                    }
                }
                if(keys.length == 0)
                    resolve();
            }

            if(self.data !== undefined && self.shared_with_me !== undefined) {
                resolve();
            } else {
                self.db.retrieveUser(self._id, true).then(function(user) {
                    if(!!user && !!(user.data))
                        self.data = user.data;
                    else
                        self.data = {};
                    if(!!user && !!(user.shared_with_me))
                        self.shared_with_me = user.shared_with_me;
                    else
                        self.shared_with_me = {};
                    if(!('whigi-system' in self.shared_with_me) || (names.length == 0 && full !== true))
                        resolve();
                    else
                        populate(names);
                }, function(e) {
                    reject(e);
                });
            }
        });
    }

    /**
     * Write the user to database.
     * @function persist
     * @public
     * @return A promise to check if everything went well.
     */
    persist() {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            function complete(resolve, reject) {
                self.updated('users');
                self.db.getDatabase().collection('users').update({_id: self._id}, self.allFields(), {upsert: true}, function(err) {
                    if(err)
                        reject(err);
                    else
                        resolve();
                });
            }
            function end() {
                var inputs = Object.assign({}, self.shared_with_me);
                self.shared_with_me = {
                    'whigi-system': self.shared_with_me['whigi-system']
                }
                complete(function() {
                    self.shared_with_me = inputs;
                    resolve();
                }, function(e) {
                    reject(e);
                });
            }

            self.fill().then(function() {
                if(self.needsTrigrams()) {
                    var inputs = Object.assign({}, self.shared_with_me), keys: string[] = Object.getOwnPropertyNames(inputs);
                    self.fill(keys).then(function() {
                        Object.assign(self.shared_with_me, inputs);
                        //Build local trigrams.
                        for(var i = 0; i < keys.length; i++) {
                            var tri = keys[i].substr(0, 3);
                            if(!(tri in self.trigrams)) {
                                self.trigrams[tri] = {
                                    _id: utils.generateRandomString(128),
                                    trigram: tri,
                                    values: {}
                                }
                                self.shared_with_me['whigi-system'][tri] = self.trigrams[tri]._id;
                            }
                            Object.assign(self.trigrams[tri].values, inputs[keys[i]]);
                        }
                        //Save them
                        var done = 0;
                        keys = Object.getOwnPropertyNames(self.trigrams);
                        for(var i = 0; i < keys.length; i++) {
                            self.db.updated(self.trigrams[keys[i]]._id, 'users');
                            self.db.getDatabase().collection('users').update({_id: self.trigrams[keys[i]]._id}, self.trigrams[keys[i]], {upsert: true}, function() {
                                done++;
                                if(done)
                                    end();
                            });
                        }
                    }, function(e) {
                        reject(e);
                    });
                } else {
                    complete(resolve, reject);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Returns a shallow copy safe for sending.
     * @function sanitarize
     * @public
     * @return Duplicated object.
     */
    sanitarize() {
        var ret = {
            is_company: this.is_company,
            company_info: this.company_info,
            rsa_pub_key: this.rsa_pub_key,
            _id: this._id,
            cert: this.cert,
            hidden_id: this.hidden_id
        };
        return ret;
    }

    /**
     * Check whether a user needs trigrams. Should be called after fill.
     * @function needsTrigrams
     * @private
     * @return {Boolean} Whether to save trigrams. Approx.
     */
    private needsTrigrams(): boolean {
        if('whigi-system' in this.shared_with_me)
            return true;
        var keys = Object.getOwnPropertyNames(this.shared_with_me);
        if(keys.length < 15000)
            return false;
        var mid = 0;
        for(var i = 0; i < 100; i++)
            mid += Object.getOwnPropertyNames(this.shared_with_me[keys[i]]).length;
        return keys.length * mid / 100 > 50000;
    }

    /**
     * Returns a shallow copy safe for sending to the user.
     * @function fields
     * @public
     * @return Duplicated object.
     */
    fields() {
        var ret = {
            is_company: this.is_company,
            company_info: this.company_info,
            password: this.password,
            salt: this.salt,
            _id: this._id,
            puzzle: this.puzzle,
            encr_master_key: this.encr_master_key,
            rsa_pub_key: this.rsa_pub_key,
            rsa_pri_key: this.rsa_pri_key,
            oauth: this.oauth,
            sha_master: this.sha_master,
            cert: this.cert,
            hidden_id: this.hidden_id,
            impersonated_prefix: this.impersonated_prefix
        };
        return ret;
    }

    /**
     * Removes this object.
     * @function unlink
     * @public
     * @return {Promise} Whether it went OK.
     */
    unlink(): Promise {
        var keys = Object.getOwnPropertyNames(this.trigrams);
        for(var i = 0; i < keys.length; i++) {
            this.db.unlink('users', this.trigrams[keys[i]]._id);
        }
        return this.unlinkFrom('users');
    }

}