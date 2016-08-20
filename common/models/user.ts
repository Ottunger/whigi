/**
 * Description of a user.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256');
var utils = require('../../utils/utils');

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
    private db: any;
    
    /**
     * Create a USer from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     */
    constructor(u, db) {
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
     * Returns a shallow copy safe for sending to the user.
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
     * Fills data field if not already there.
     * @function fetchData
     * @private
     * @return A promise to check if everything went well.
     */
    private fetchData() {
        return new Promise(function(resolve, reject) {
            if(this.data !== undefined)
                resolve();
            else {
                this.db.collection('users').findOne({_id: this._id}, function(e, user) {
                    if(e || user === undefined)
                        reject(e);
                    else {
                        this.data = user.data;
                        resolve();
                    }
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
        return new Promise(function(resolve, reject) {
            this.fetchData().then(function() {
                this.db.collection('users').update({_id: this._id}, this.allFields(), {upsert: true}, function(e) {
                    if(!e)
                        resolve();
                    else
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