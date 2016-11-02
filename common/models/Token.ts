/**
 * Description of a token.
 * @module Token
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';
import {IModel} from './IModel';

export class Token extends IModel {

    /**
     * Create a Token from a bare database description.
     * @function constructor
     * @public
     * @param id New id.
     * @param bearer_id Bearer.
     * @param last_refresh Last refresh.
     * @param is_eternal Is ticket alsways valid.
     * @param db Datasource, usually a DB and remote servers.
     */
    constructor(id: string, public bearer_id: string, public last_refresh: number, public is_eternal: boolean, db: Datasource) {
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
            last_refresh: this.last_refresh,
            is_eternal: this.is_eternal
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
        this.updated('tokens');
        return this.db.getDatabase().collection('tokens').update({_id: this._id}, this.allFields(), {upsert: true});
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
    unlink(): Promise {
        return this.unlinkFrom('tokens');
    }

}
