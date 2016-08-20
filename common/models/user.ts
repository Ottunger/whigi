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
    public data;
    
    /**
     * Create a USer from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     */
    constructor(u) {
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
        else
            this._id = utils.generateRandomString(8);
        if('email' in u)
            this.email = u.email;
        if('puzzle' in u)
            this.puzzle = u.puzzle;
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
        if('username' in upt)
            this.username = upt.username;
        if('email' in upt)
            this.email = upt.email;
    }

    /**
     * Write the user to database.
     * @function persist
     * @public
     */
    persist() {
        //TODO Function persist
    }

    /**
     * Returns a shallow copy safe for sending.
     * @function sanitarize
     * @public
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
            puzzle: this.puzzle
        };
        return ret;
    }

}