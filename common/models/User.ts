/**
 * Description of a user.
 * @module User
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256');
import {Datasource} from '../Datasource';
import {IModel} from './Imodel';

export var fields = {
    username: true,
    key: true,
    is_activated: true,
    password: true,
    salt: true,
    _id: true,
    email: true,
    puzzle: true,
    encr_master_key: true,
    rsa_pub_key: true,
    rsa_pri_key: true,
    data: true,
    shared_with_me: true
}

export class User extends IModel {

    public username: string;
    public key: string;
    public is_activated: boolean;
    public password: string;
    public salt: string;
    public email: string;
    public puzzle: string;
    public encr_master_key: string;
    public rsa_pub_key: string;
    public rsa_pri_key: string;
    public data;
    public shared_with_me;
    
    /**
     * Create a User from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(u, db: Datasource) {
        super(u._id, db);
        if('username' in u)
            this.username = u.username;
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
        if('rsa_pub_key' in u)
            this.rsa_pub_key = u.rsa_pub_key;
        if('rsa_pri_key' in u)
            this.rsa_pri_key = u.rsa_pri_key;
        if('data' in u)
            this.data = u.data;
        if('shared_with_me' in u)
            this.shared_with_me = u.shared_with_me;
    }

    /**
     * Merge fields of upt into the object. Manages the key updates involved.
     * @function applyUpdate
     * @public
     * @param upt The update.
     */
    applyUpdate(upt) {
        if('password' in upt && 'encr_master_key' in upt) {
            this.password = hash.sha256(upt.password + this.salt);
            this.encr_master_key = upt.encr_master_key;
        }
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @protected
     * @return Duplicated object.
     */
    protected allFields() {
        var ret = {
            username: this.username,
            key: this.key,
            password: this.password,
            salt: this.salt,
            _id: this._id,
            email: this.email,
            is_activated: this.is_activated,
            puzzle: this.puzzle,
            encr_master_key: this.encr_master_key,
            rsa_pub_key : this.rsa_pub_key,
            rsa_pri_key: this.rsa_pri_key,
            data: this.data,
            shared_with_me: this.shared_with_me
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
            if(self.data !== undefined && self.shared_with_me !== undefined) {
                resolve();
            } else {
                self.db.retrieveUser('id', self._id, true).then(function(user) {
                    if(!!user && !!(user.data))
                        self.data = user.data;
                    else
                        self.data = {};
                    if(!!user && !!(user.shared_with_me))
                        self.shared_with_me = user.shared_with_me;
                    else
                        self.shared_with_me = {};
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
            rsa_pub_key: this.rsa_pub_key,
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
            key: this.key,
            password: this.password,
            salt: this.salt,
            _id: this._id,
            email: this.email,
            is_activated: this.is_activated,
            puzzle: this.puzzle,
            encr_master_key: this.encr_master_key,
            rsa_pub_key: this.rsa_pub_key,
            rsa_pri_key: this.rsa_pri_key
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
        return this.unlinkFrom('users');
    }

}