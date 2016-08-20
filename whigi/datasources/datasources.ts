/**
 * API dealing with the getting of information from several sources
 * @module datasources
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {User} from '../../common/models/user';

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
     * Retrieves a User from storage.
     * @function retrieveUser
     * @public
     */
    retrieveUser(mode: string, value: any): Promise<User> {
        return new Promise(function(resolve, reject) {
            //TODO how to retrieve user from database from different fields
            this.db.find(function(e, u) {
                if(!e) {
                    var user = new User(u);
                    resolve(user);
                } else {
                    reject(e);
                }
            });
        });
    }

}