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
        function complete(resolve, reject, e, user) {
            if(e) 
                reject(e);
            else {
                if(user === undefined)
                    resolve(undefined);
                else
                    resolve(new User(user, this.db));
            }
        }

        return new Promise(function(resolve, reject) {
            switch(mode) {
                case 'id':
                    this.db.collection('users').findOne({_id: value}, {data: false}, function(e, user) {
                        complete(resolve, reject, e, user);
                    });
                    break;
                case 'username':
                    this.db.collection('users').findOne({username: value}, {data: false}, function(e, user) {
                        complete(resolve, reject, e, user);
                    });
                    break;
                case 'pwd_key':
                    this.db.collection('users').findOne({pwd_key: value}, {data: false}, function(e, user) {
                        complete(resolve, reject, e, user);
                    });
                    break;
                case 'key':
                    this.db.collection('users').findOne({key: value}, {data: false}, function(e, user) {
                        complete(resolve, reject, e, user);
                    });
                    break;
                case 'email':
                    this.db.collection('users').findOne({email: value}, {data: false}, function(e, user) {
                        complete(resolve, reject, e, user);
                    });
                    break;
                default:
                    reject(true);
            }
        });
    }

}