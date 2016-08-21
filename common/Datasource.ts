/**
 * API dealing with the getting of information from several sources
 * @module Datasource
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {User, fields} from './models/User';
import {Datafragment} from './models/Datafragment';

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
     * Retrieves a User from storage. By default does not load its data mappings.
     * @function retrieveUser
     * @public
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
     */
    retrieveData(id: string): Promise<Datafragment> {
        var self = this;

        return new Promise(function(resolve, reject) {
            self.db.collection('datas').findOne({_id: id}).then(function(data) {
                if(data === undefined || data == null)
                    resolve(undefined);
                else
                    resolve(new Datafragment(data._id, data.encr_data, self));
            }, function(e) {
                reject(e);
            });
        });
    }

}