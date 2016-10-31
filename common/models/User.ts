/**
 * Description of a user.
 * @module User
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256');
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
    public shared_with_me: any;
    public oauth: any[];
    public sha_master: string;
    public cert: string;
    public hidden_id: string;

    public impersonated_prefix: string;
    
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
        this.impersonated_prefix = undefined;
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
     * @protected
     * @return Duplicated object.
     */
    protected allFields() {
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
     * @return A promise when ready.
     */
    fill() {
        var self = this;

        return new Promise(function(resolve, reject) {
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
                self.updated('users');
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
            hidden_id: this.hidden_id
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