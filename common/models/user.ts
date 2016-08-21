/**
 * Description of a user.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256');
var utils = require('../../utils/utils');
import {Datasource} from '../datasources';

export var fields = {
    username: true,
    pwd_key: true,
    key: true,
    is_activated: true,
    password: true,
    salt: true,
    _id: true,
    email: true,
    puzzle: true,
    encr_master_key: true,
    data: true
}

export class User {

    public username: string;
    public pwd_key: string;
    public key: string;
    public is_activated: boolean;
    public password: string;
    public salt: string;
    public _id: string;
    public email: string;
    public puzzle: string;
    public encr_master_key: string;
    public data;
    private db: Datasource;
    
    /**
     * Create a USer from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(u, db: Datasource) {
        if('username' in u)
            this.username = u.username;
        if('pwd_key' in u)
            this.pwd_key = u.pwd_key;
        if('key' in u)
            this.key = u.key;
        if('is_activated' in u)
            this.is_activated = u.is_activated;
        if('password' in u)
            this.password = u.password;
        if('salt' in u)
            this.salt = u.salt;
        if('_id' in u)
            this._id = u._id;
        if('email' in u)
            this.email = u.email;
        if('puzzle' in u)
            this.puzzle = u.puzzle;
        if('encr_master_key' in u)
            this.encr_master_key = u.encr_master_key;
        if('data' in u)
            this.data = u.data;
        
        this.db = db;
    }

    /**
     * Merge fields of upt into the object.
     * @function applyUpdate
     * @public
     * @param upt The update.
     */
    applyUpdate(upt) {
        if('password' in upt)
            this.password = hash.sha256(upt.password + this.salt);
        if('email' in upt && /^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(upt.email))
            this.email = upt.email;
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @private
     * @return Duplicated object.
     */
    private allFields() {
        var ret = {
            username: this.username,
            pwd_key: this.pwd_key,
            key: this.key,
            password: this.password,
            salt: this.salt,
            _id: this._id,
            email: this.email,
            is_activated: this.is_activated,
            puzzle: this.puzzle,
            encr_master_key: this.encr_master_key,
            data: this.data
        };
        return ret;
    }

    /**
     * Fills the data in a user if not already done.
     * @function fill
     * @public
     * @return A promise when ready.
     */
    fill() {
        var self = this;

        return new Promise(function(resolve, reject) {
            if(self.data !== undefined) {
                resolve();
            } else {
                self.db.retrieveUser('id', self._id, true).then(function(user) {
                    if(!!user && !!(user.data))
                        self.data = user.data;
                    else
                        self.data = {};
                    resolve();
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
            self.fill().then(function() {
                self.db.getDatabase().collection('users').update({_id: self._id}, self.allFields(), {upsert: true}).then(function() {
                    resolve();
                }, function(e) {
                    reject(e);
                });
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
            username: this.username,
            email: this.email,
            is_activated: this.is_activated,
            _id: this._id
        };
        return ret;
    }

    /**
     * Returns a shallow copy safe for sending to the user.
     * @function fields
     * @public
     * @return Duplicated object.
     */
    fields() {
        var ret = {
            username: this.username,
            pwd_key: this.pwd_key,
            key: this.key,
            password: this.password,
            salt: this.salt,
            _id: this._id,
            email: this.email,
            is_activated: this.is_activated,
            puzzle: this.puzzle,
            encr_master_key: this.encr_master_key
        };
        return ret;
    }

}