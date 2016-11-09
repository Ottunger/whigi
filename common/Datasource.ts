/**
 * API dealing with the getting of information from several sources
 * @module Datasource
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {User, fields} from './models/User';
import {Datafragment} from './models/Datafragment';
import {Token} from './models/Token';
import {Vault} from './models/Vault';
import {Oauth} from './models/Oauth';
import {Uploader} from './cdnize/CCUploader';
import {Downloader} from './cdnize/CCDownloader';
import {Integrity} from './cdnize/Integrity';

export class Datasource {

    private up: Uploader;
    private down: Downloader;
    private int: Integrity;

    /**
     * Saves the database for later use by the connector.
     * @function constructor
     * @public
     * @param {Request} db The database.
     * @param {String} basedir Install directory.
     * @param {Boolean} useCDN Use the CDN facilities. Defaults to false.
     * @param {Boolean} userIntegrity Check integraity. Defaults to true.
     */
    constructor(private db: any, basedir: string, private useCDN?: boolean, userIntegrity?: boolean) {
        userIntegrity = userIntegrity !== false;
        this.useCDN = this.useCDN || false;
        if(this.useCDN) {
            //this.up = new Uploader(24, 20, this.db, ['datas', 'tokens', 'users', 'vaults', 'oauths']);
            this.up = new Uploader(60);
            this.down = new Downloader();
            if(userIntegrity)
                this.int = new Integrity(12, basedir);
        }
    }

    /**
     * Closes the underlying connection.
     * @function closeUnderlying
     * @public
     */
    closeUnderlying() {
        if(this.useCDN)
            this.up.close();
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
     * Mark an item as updated.
     * @function updated
     * @public
     * @param {String} id Id.
     * @param {String} name collection name.
     * @param {Boolean} deleted Deleted or not.
     */
    updated(id: string, name: string, deleted?: boolean) {
        if(this.useCDN) {
            deleted = deleted || false;
            this.up.markUpdated(id, name, deleted);
        }
    }

    /**
     * Unlink an object, reflecting it ASAP.
     * @function Unlink
     * @public
     * @param {String} name Collection name.
     * @param {String} id _id.
     * @return {Promise} Whether went OK locally.
     */
    unlink(name: string, id: string): Promise {
        this.updated(id, name, true);
        return this.db.collection(name).remove({_id: id});
    }

    /**
     * Retrieves an object from storage, based on its _id.
     * @function retrieveGeneric
     * @public
     * @param {String} db Database name.
     * @param {Object} query Query projection.
     * @param {Object} selector Projection field.
     * @return {Promise} The required item.
     */
    retrieveGeneric(db: string, query: any, selector: any): Promise<any> {
        var self = this;
        if(this.useCDN && this.up.isReady()) {
            return new Promise(function(resolve, reject) {
                self.db.collection(db).findOne(query, selector).then(function(data) {
                    if(!!data) {
                        resolve(data);
                    } else {
                        self.down.fetch(query._id, db).then(function(data) {
                            resolve(data);
                        }, function(e) {
                            reject(e);
                        });
                    }
                }, function(e) {
                    self.down.fetch(query._id, db).then(function(data) {
                        resolve(data);
                    }, function(e) {
                        reject(e);
                    });
                });
            });
        } else {
            return this.db.collection(db).findOne(query, selector);
        }
    }

    /**
     * Retrieves a User from storage. By default does not load its data mappings.
     * @function retrieveUser
     * @public
     * @param {String} id User id.
     * @param {Boolean} data Whether to retrieve data array.
     * @param {String[]} names If data required, names to ensure to have.
     * @return {Promise} The required item.
     */
    retrieveUser(id: string, data?: boolean, names?: string[]): Promise<User> {
        var self = this;
        names = names || [];
        var decl = (data === true && names.length == 0)? fields : {data: false, shared_with_me: false};

        return new Promise<User>(function(resolve, reject) {
            self.retrieveGeneric('users', {_id: id}, decl).then(function(doc) {
                if(!!doc) {
                    var u: User = new User(doc, self);
                    if(data === true && names.length > 0) {
                        u.fill(names).then(function() {
                            resolve(u);
                        }, function(e) {
                            reject();
                        });
                    } else {
                        resolve(u);
                    }
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
                    resolve(new Datafragment(data._id, data.encr_data, data.version, data.encr_aes, self));
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
     * @param {String} id Id.
     * @return {Promise} The required item.
     */
    retrieveVault(id: string): Promise<Vault> {
        var self = this;

        return new Promise<Vault>(function(resolve, reject) {
            self.retrieveGeneric('vaults', {_id: id}, {none: false}).then(function(data) {
                if(!!data) {
                    resolve(new Vault(data, self));
                } else {
                    resolve(undefined);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Retrieves a Oauth from storage.
     * @function retrieveOauth
     * @public
     * @param {String} id _id.
     * @return {Promise} The required item.
     */
    retrieveOauth(id: string): Promise<Oauth> {
        var self = this;

        return new Promise<Oauth>(function(resolve, reject) {
            self.retrieveGeneric('oauths', {_id: id}, {none: false}).then(function(data) {
                if(!!data) {
                    resolve(new Oauth(data._id, data.bearer_id, data.for_id, data.prefix, self));
                } else {
                    resolve(undefined);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Retrieves a Token from storage.
     * @function retrieveToken
     * @public
     * @param {Object} sel Selector.
     * @return {Promise} The required item.
     */
    retrieveToken(sel: any): Promise<Token> {
        var self = this;

        return new Promise<Token>(function(resolve, reject) {
            self.retrieveGeneric('tokens', sel, {none: false}).then(function(data) {
                if(!!data) {
                    resolve(new Token(data._id, data.bearer_id, data.last_refresh, data.is_eternal, self));
                } else {
                    resolve(undefined);
                }
            }, function(e) {
                reject(e);
            });
        });
    }

}