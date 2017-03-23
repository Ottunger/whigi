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

interface More {
    _id: string;
    trigram: string;
    values: {[id: string]: {[id: string]: string}};
}

export class User extends IModel {

    public is_company: number;
    public company_info: any;
    public password?: string;
    public salt?: string;
    public puzzle: string;
    public encr_master_key?: string;
    public rsa_pub_key: string;
    public rsa_pri_key?: number[][];
    public data: any;
    public shared_with_me: {[id: string]: {[id: string]: string}};
    public oauth: any[];
    public sha_master?: string;
    public cert?: string;
    public hidden_id: string;
    public impersonated_prefix: string;
    public oauth_admin: boolean;
    private trigrams: {[id: string]: More};
    //Specific
    public lfetch: number;
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
        this.is_company = u.is_company;
        this.company_info = u.company_info;
        this.password = u.password;
        this.salt = u.salt;
        this.puzzle = u.puzzle;
        this.encr_master_key = u.encr_master_key;
        this.rsa_pub_key = u.rsa_pub_key;
        this.rsa_pri_key = u.rsa_pri_key;
        this.data = u.data;
        this.shared_with_me = u.shared_with_me;
        this.oauth = u.oauth;
        this.sha_master = u.sha_master;
        this.cert = u.cert;
        this.hidden_id = u.hidden_id;
        this.oauth_admin = false;
        //Special keys...
        this.trigrams = {};
        this.lfetch = u.lfetch || 0;
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
     * @param {Object} shared Shared with me of pref.
     * @return Duplicated object.
     */
    allFields(shared) {
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
            shared_with_me: shared || this.shared_with_me,
            oauth: this.oauth,
            sha_master: this.sha_master,
            cert: this.cert,
            hidden_id: this.hidden_id
        };
        var keys = Object.getOwnPropertyNames(ret);
        for(var i = 0; i < keys.length; i++)
            if(ret[keys[i]] == undefined)
                delete ret[keys[i]];
        return ret;
    }

    /**
     * Fills the data in a user if not already done.
     * @function fill
     * @public
     * @param {Array} names Names to add for split shares.
     * @param {Boolean} full Force completely full.
     * @return {Promise} A promise when ready.
     */
    fill(names: string[], full?: boolean): Promise<undefined> {
        var self = this, needed = {}, keys: string[], done = 0;
        if(!self.shared_with_me['whigi-system'])
            return Promise.resolve();
        if(full !== true) {
            for(var i = 0; i < names.length; i++)
                needed[names[i].substr(0, 3)] = true;
            keys = Object.getOwnPropertyNames(needed);
        } else {
            keys = User.trgs;
        }

        return new Promise(function(resolve, reject) {
            //Now check if we already have all keys asked
            for(var i = 0; i < keys.length; i++) {
                if(!self.shared_with_me['whigi-system'][keys[i]]) {
                    keys.splice(i, 1);
                    i--;
                }
            }
            //Now do
            for(var i = 0; i < keys.length; i++) {
                self.db.retrieveGeneric('users', {_id: self.shared_with_me['whigi-system'][keys[i]]}, {}).then(function(add: More) {
                    Object.assign(self.shared_with_me, add.values);
                    //Save ref for on persist
                    self.trigrams[add.trigram] = add;
                    done++;
                    if(done >= keys.length)
                        resolve();
                }, function(e) {
                    done++;
                    if(done >= keys.length)
                        resolve();
                });
            }
            if(keys.length == 0) {
                resolve();
                return;
            }
        });
    }

    /**
     * Notify db that done.
     * @function dispose
     * @public
     */
    dispose() {
        var self = this;
        setTimeout(function() {
            if(new Date().getTime() - self.lfetch > 5*60*1000) {
                self.persist().then(function() {
                    delete self.db.uids[self._id];
                }, function(e) {
                    self.dispose();
                });
            } else {
                self.dispose();
            }
        }, 20*1000);
    }

    /**
     * Write the user to database.
     * @function persist
     * @public
     * @param {Boolean} close If close.
     * @return A promise to check if everything went well.
     */
    persist(close: boolean = true) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            function complete(system) {
                self.updated('users');
                self.db.getDatabase().collection('users').update({_id: self._id}, {$set: self.allFields(system)}, {upsert: true}, function(err) {
                    if(close)
                        self.dispose();
                    if(err)
                        reject(err);
                    else 
                        resolve();
                });
            }

            if(self.needsTrigrams()) {
                //We (1) copy modifications, (2) make sure we have what we before, and then (3) reapply them above.
                var inputs = JSON.parse(JSON.stringify(self.shared_with_me)), keys: string[] = Object.getOwnPropertyNames(inputs);
                self.fill(keys).then(function() {
                    Object.assign(self.shared_with_me, inputs);
                    keys = Object.getOwnPropertyNames(self.shared_with_me);
                    //Build local trigrams.
                    var system = {'whigi-system': {}};
                    for(var i = 0; i < keys.length; i++) {
                        var tri = keys[i].substr(0, 3);
                        if(!(tri in self.trigrams)) {
                            self.trigrams[tri] = {
                                _id: utils.generateRandomString(128),
                                trigram: tri,
                                values: {}
                            }
                        }
                        system['whigi-system'][tri] = self.trigrams[tri]._id;
                        self.trigrams[tri].values[keys[i]] = self.trigrams[tri].values[keys[i]] || {};
                        Object.assign(self.trigrams[tri].values[keys[i]], self.shared_with_me[keys[i]]);
                    }
                    //Now we are dependent, sorry...
                    self.shared_with_me['whigi-system'] = self.shared_with_me['whigi-system'] || {};
                    //We will save what was behind as well, of course!
                    Object.assign(system, self.shared_with_me['whigi-system']);
                    //Save them
                    var done = 0;
                    keys = Object.getOwnPropertyNames(self.trigrams);
                    for(var i = 0; i < keys.length; i++) {
                        self.db.updated(self.trigrams[keys[i]]._id, 'users');
                        self.db.getDatabase().collection('users').update({_id: self.trigrams[keys[i]]._id}, self.trigrams[keys[i]], {upsert: true}, function() {
                            done++;
                            if(done >= keys.length) {
                                complete(system);
                            }
                        });
                    }
                }, function(e) {
                    reject(e);
                });
            } else {
                complete(undefined);
            }
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
        if(keys.length < 5000)
            return false;
        else if(keys.length > 10000)
            return true;
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
    unlink(): Promise<undefined> {
        var keys = Object.getOwnPropertyNames(this.trigrams);
        for(var i = 0; i < keys.length; i++) {
            this.db.unlink('users', this.trigrams[keys[i]]._id);
        }
        return this.unlinkFrom('users');
    }

}