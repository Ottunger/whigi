/**
 * Description of a mapping.
 * @module Mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any

export class Mapping {

    public email: string;
    public master_key: string;
    public pwd_key: string;
    public _id: string;
    public time_changed: number;
    private db: any;
    
    /**
     * Create a USer from a bare database description.
     * @function constructor
     * @public
     * @param id ID.
     * @param email Email of user.
     * @param master_key Master key of user.
     * @param time_changed Last time pwd_ket was created.
     * @param pwd_key Password key.
     * @param db Database.
     */
    constructor(id: string, email: string, master_key: string, time_changed: number, pwd_key: string, db: any) {
        this._id = id;
        this.email = email;
        this.master_key = master_key;
        this.time_changed = time_changed;
        this.pwd_key = pwd_key;
        this.db = db;
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @protected
     * @return Duplicated object.
     */
    protected allFields() {
        var ret = {
            _id: this._id,
            email: this.email,
            master_key: this.master_key,
            pwd_key: this.pwd_key,
            time_changed: this.time_changed
        };
        return ret;
    }

    /**
     * Write the user to database.
     * @function persist
     * @public
     * @return A promise to check if everything went well.
     */
    persist() {
        return this.db.collection('mappings').update({_id: this._id}, this.allFields(), {upsert: true});
    }

    /**
     * Returns a shallow copy safe for sending.
     * @function sanitarize
     * @public
     * @param {Boolean} key Whether to add the keys in mapping.
     * @return Duplicated object.
     */
    sanitarize(key: boolean) {
        var ret = {
            email: this.email,
            _id: this._id,
            time_changed: this.time_changed
        };
        if(key) {
            ret['pwd_key'] = this.pwd_key;
            ret['master_key'] = this.master_key;
        }
        return ret;
    }

}