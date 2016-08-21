/**
 * API dealing with the getting of information from several sources
 * @module datasources
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {User} from './models/user';

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
     * Retrieves a User from storage.
     * @function retrieveUser
     * @public
     */
    retrieveUser(mode: string, value: string): Promise<User> {
        var self = this;

        return new Promise(function(resolve, reject) {
            if(mode === 'id')
                mode = '_id';
            var sel = {};
            sel[mode] = value;
            self.db.collection('users').findOne(sel, {data: false}).then(function(user) {
                if(user === undefined || user == null)
                    resolve(undefined);
                else
                    resolve(new User(user, self));
            }, function(e) {
                reject(e);
            });
        });
    }

}