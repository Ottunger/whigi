/**
 * Description of a vault record.
 * @module Vault
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';
import {IModel} from './IModel';

export class Vault extends IModel {

    public shared_to_id: string;
    public data_name: string;
    public aes_crypted_shared_pub: string;
    public data_crypted_aes: string;
    public sharer_id: string;
    public last_access: number;
    public expire_epoch: number;

    /**
     * Create a Vault from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(u, db: Datasource) {
        super(u._id, db);
        if('shared_to_id' in u)
            this.shared_to_id = u.shared_to_id;
        if('data_name' in u)
            this.data_name = u.data_name;
        if('aes_crypted_shared_pub' in u)
            this.aes_crypted_shared_pub = u.aes_crypted_shared_pub;
        if('data_crypted_aes' in u)
            this.data_crypted_aes = u.data_crypted_aes;
        if('sharer_id' in u)
            this.sharer_id = u.sharer_id;
        if('last_access' in u)
            this.last_access = u.last_access;
        if('expire_epoch' in u)
            this.expire_epoch = u.expire_epoch;
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @protected
     * @return Duplicated object.
     */
    protected allFields() {
        var ret = {
            shared_to_id: this.shared_to_id,
            data_name: this.data_name,
            aes_crypted_shared_pub: this.aes_crypted_shared_pub,
            data_crypted_aes: this.data_crypted_aes,
            _id: this._id,
            sharer_id: this.sharer_id,
            last_access: this.last_access,
            expire_epoch: this.expire_epoch
        };
        return ret;
    }

    /**
     * Write the vault to database.
     * @function persist
     * @public
     * @return A promise to check if everything went well.
     */
    persist() {
        this.updated('vaults');
        return this.db.getDatabase().collection('vaults').update({_id: this._id}, this.allFields(), {upsert: true});
    }

    /**
     * Returns a shallow copy safe for sending.
     * @function sanitarize
     * @public
     * @return Duplicated object.
     */
    sanitarize() {
        return this.allFields();
    }

    /**
     * Removes this object.
     * @function unlink
     * @public
     * @return {Promise} Whether it went OK.
     */
    unlink(): Promise {
        return this.unlinkFrom('vaults');
    }

}
