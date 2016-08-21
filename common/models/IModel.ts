/**
 * Description of a a database record.
 * @module IModel
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';

export abstract class IModel {

    public _id: string;
    protected db: Datasource;

    /**
     * Create a Model from the database.
     * @function constructor
     * @public
     * @param {String} id _id.
     * @param {Datasource} db Datasource, usually a DB and remote servers.
     */
    constructor(_id: string, db: Datasource) {
        this._id = _id;
        this.db = db;
    }

    /**
     * Removes a mapping with this id from the database collection given.
     * @function unlinkFrom
     * @protected
     * @param {String} name The collection name.
     * @return {Promise} Whether it went OK.
     */
    protected unlinkFrom(name: string): Promise {
        return this.db.unlink(name, this._id);
    }

    protected abstract allFields(): any
    abstract persist()
    abstract sanitarize()
    abstract unlink(): Promise

}