/**
 * Description of a OAuth token.
 * @module Oauth
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';
import {IModel} from './IModel';

export class Oauth extends IModel {

    /**
     * Create a Token from a bare database description.
     * @function constructor
     * @public
     * @param id New id.
     * @param bearer_id Bearer.
     * @param for_id App name.
     * @param prefix Prefix granted.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(id: string, public bearer_id: string, public for_id: string, public prefix: string, db: Datasource) {
        super(id, db);
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @public
     * @return Duplicated object.
     */
    allFields() {
        var ret = {
            _id: this._id,
            bearer_id: this.bearer_id,
            for_id: this.for_id,
            prefix: this.prefix
        };
        return ret;
    }

    /**
     * Write the token to database.
     * @function persist
     * @public
     * @return A promise to check if everything went well.
     */
    persist() {
        var self = this;
        this.updated('oauths');
        return new Promise(function(resolve, reject) {
            self.db.getDatabase().collection('oauths').update({_id: self._id}, self.allFields(), {upsert: true}, function(err) {
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
        return this.unlinkFrom('oauths');
    }

}
