/**
 * API dealing with the getting of information from several sources
 * @module Datasource
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {User, fields} from './models/User';
import {Datafragment} from './models/Datafragment';
import {Vault} from './models/Vault';

export class Datasource {

    private db;

    /**
     * Saves the database for later use by the connector.
     * @function constructor
     * @public
     * @param {Request} d The database.
     */
    constructor(d) {
        this.db = d;
    }

    /**
     * Closes the underlying connection.
     * @function closeUnderlying
     * @public
     */
    closeUnderlying() {
        this.db.close();
    }

    /**
     * Returns the local DB.
     * @function getDatabase
     * @public
     * @return The database.
     */
    getDatabase() {
        return this.db;
    }

    /**
     * Retrieves an object from storage, based on its _id.
     * @function retrieveGeneric
     * @private
     * @param {String} db Database name.
     * @param {String} id _id.
     * @return {Promise} The required item.
     */
    private retrieveGeneric(db: string, id: string): Promise<any> {
        var self = this;

        return new Promise(function(resolve, reject) {
            self.db.collection(db).findOne({_id: id}).then(function(data) {
                if(data === undefined || data == null)
                    resolve(undefined);
                else
                    resolve(new Datafragment(data._id, data.encr_data, self));
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Retrieves a User from storage. By default does not load its data mappings.
     * @function retrieveUser
     * @public
     * @param {String} mode Mode for retrieval.
     * @param {String} value Value for this mode.
     * @param {Boolean} data Whether to retrieve data array.
     * @return {Promise} The required item.
     */
    retrieveUser(mode: string, value: string, data?: boolean): Promise<User> {
        var self = this;
        var decl = (data === true)? fields : {data: false};

        return new Promise(function(resolve, reject) {
            if(mode === 'id')
                mode = '_id';
            var sel = {};
            sel[mode] = value;
            self.db.collection('users').findOne(sel, decl).then(function(user) {
                if(user === undefined || user == null)
                    resolve(undefined);
                else
                    resolve(new User(user, self));
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Retrieves a Datafragment from storage.
     * @function retrieveData
     * @public
     * @param {String} id _id.
     * @return {Promise} The required item.
     */
    retrieveData(id: string): Promise<Datafragment> {
        return this.retrieveGeneric('datas', id);
    }

    /**
     * Retrieves a Vault from storage.
     * @function retrieveVault
     * @public
     * @param {String} id _id.
     * @return {Promise} The required item.
     */
    retrieveVault(id: string): Promise<Vault> {
        return this.retrieveGeneric('vaults', id);
    }

}