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
    public is_dated: boolean;
    public trigger: string;
    public real_name: string;
    public version: number;
    public storable: string[];
    public links: string[];

    /**
     * Create a Vault from a bare database description.
     * @function constructor
     * @public
     * @param u Description.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(u, db: Datasource) {
        super(u._id, db);
        this.shared_to_id = u.shared_to_id;
        this.data_name = u.data_name;
        this.aes_crypted_shared_pub = u.aes_crypted_shared_pub;
        this.data_crypted_aes = u.data_crypted_aes;
        this.sharer_id = u.sharer_id;
        this.last_access = u.last_access;
        this.expire_epoch = u.expire_epoch;
        this.is_dated = u.is_dated;
        this.trigger = u.trigger;
        this.real_name = u.real_name;
        this.version = u.version;
        this.storable = u.storable;
        this.links = u.links || [];
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @public
     * @return Duplicated object.
     */
    allFields() {
        var ret = {
            shared_to_id: this.shared_to_id,
            data_name: this.data_name,
            aes_crypted_shared_pub: this.aes_crypted_shared_pub,
            data_crypted_aes: this.data_crypted_aes,
            _id: this._id,
            sharer_id: this.sharer_id,
            last_access: this.last_access,
            expire_epoch: this.expire_epoch,
            is_dated: this.is_dated,
            trigger: this.trigger,
            real_name: this.real_name,
            version: this.version,
            storable: this.storable,
            links: this.links
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
        var self = this;
        this.updated('vaults');
        return new Promise(function(resolve, reject) {
            self.db.getDatabase().collection('vaults').update({_id: self._id}, self.allFields(), {upsert: true}, function(err) {
                if(err)
                    reject(err);
                else
                    resolve();
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
        return this.allFields();
    }

    /**
     * Removes this object.
     * @function unlink
     * @public
     * @return {Promise} Whether it went OK.
     */
    unlink(): Promise<undefined> {
        return this.unlinkFrom('vaults');
    }

}
