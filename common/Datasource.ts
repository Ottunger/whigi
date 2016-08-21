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
     * Unlink an object, reflecting it ASAP.
     * @function Unlink
     * @public
     * @TODO Propagate
     * @param {String} name Collection name.
     * @param {String} id _id.
     * @return {Promise} Whether went OK locally.
     */
    unlink(name: string, id: string) {
        return this.db.collection(name).remove({_id: id});
    }

    /**
     * Retrieves an object from storage, based on its _id.
     * @function retrieveGeneric
     * @private
     * @param {String} db Database name.
     * @param {Object} query Query projection.
     * @param {Object} selector Projection field.
     * @return {Promise} The required item.
     */
    private retrieveGeneric(db: string, query: any, selector: any): Promise<any> {
        return this.db.collection(db).findOne(query, selector);
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
        if(mode === 'id')
            mode = '_id';
        var sel = {};
        sel[mode] = value;

        return new Promise<User>(function(resolve, reject) {
            self.retrieveGeneric('users', sel, decl).then(function(data) {
                if(!!data) {
                    console.log(data);
                    resolve(new User(data, self.db));
                } else {
                    resolve(undefined);
                }
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
        var self = this;

        return new Promise<Datafragment>(function(resolve, reject) {
            self.retrieveGeneric('datas', {_id: id}, {none: false}).then(function(data) {
                if(!!data) {
                    resolve(new Datafragment(data._id, data.encr_data, self.db));
                } else {
                    resolve(undefined);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Retrieves a Vault from storage.
     * @function retrieveVault
     * @public
     * @param {Object} sel Selector.
     * @return {Promise} The required item.
     */
    retrieveVault(sel): Promise<Vault> {
        var self = this;

        return new Promise<Vault>(function(resolve, reject) {
            self.retrieveGeneric('vaults', sel, {none: false}).then(function(data) {
                if(!!data) {
                    resolve(new Vault(data, self.db));
                } else {
                    resolve(undefined);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

}