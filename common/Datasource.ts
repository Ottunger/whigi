/**
 * API dealing with the getting of information from several sources
 * @module Datasource
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {User} from './models/User';
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
    public uids: {[id: string]: User};

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
        this.uids = {};
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
    unlink(name: string, id: string): Promise<undefined> {
        var self = this;
        this.updated(id, name, true);
        return new Promise(function(resolve, reject) {
            self.db.collection(name).remove({_id: id}, function(err) {
                if(err)
                    reject(err);
                else
                    resolve();
            });
        });
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
        return new Promise(function(resolve, reject) {
            if(self.useCDN && self.up.isReady()) {
                self.db.collection(db).findOne(query, selector, function(err, data) {
                    if(err || !data) {
                        self.down.fetch(query._id, db).then(function(data) {
                            resolve(data);
                        }, function(e) {
                            reject(e);
                        });
                    } else {
                        resolve(data);
                    }
                });
            } else {
                self.db.collection(db).findOne(query, selector, function(err, data) {
                    if(err)
                        reject(err);
                    else
                        resolve(data);
                });
            }
        });
    }

    /**
     * Retrieves a User from storage. By default does not load its data mappings.
     * @function retrieveUser
     * @public
     * @param {String} id User id.
     * @param {String[]} names If data required, names to ensure to have.
     * @return {Promise} The required item.
     */
    retrieveUser(id: string, names: string[]): Promise<User> {
        var self = this;

        return new Promise<User>(function(resolve, reject) {
            function complete(doc: User) {
                if(!!doc) {
                    if(!doc.lfetch) {
                        //Maybe someone had it??
                        doc = self.uids[id] || doc;
                        if(!doc.lfetch) {
                            //Newly fetched!
                            doc = new User(doc, self);
                            self.uids[id] = doc;
                            //Start ticking...
                            doc.dispose();
                        }
                    }
                    doc.lfetch = new Date().getTime();
                    if(names.length > 0) {
                        doc.fill(names).then(function() {
                            resolve(doc);
                        }, function(e) {
                            reject();
                        });
                    } else {
                        resolve(doc);
                    }
                } else {
                    resolve(undefined);
                }
            }
            //Try to get from local store
            if(!self.uids[id]) {
                self.retrieveGeneric('users', {_id: id}, {}).then(function(doc: User) {
                    complete(doc);
                }, function(e) {
                    reject(e);
                });
            } else {
                complete(self.uids[id]);
            }
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