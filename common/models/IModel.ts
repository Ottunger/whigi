/**
 * Description of a a database record.
 * @module IModel
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';

export abstract class IModel {

    /**
     * Create a Model from the database.
     * @function constructor
     * @public
     * @param {String} id _id.
     * @param {Datasource} db Datasource, usually a DB and remote servers.
     */
    constructor(public _id: string, protected db: Datasource) {

    }

    /**
     * Removes a mapping with this id from the database collection given.
     * @function unlinkFrom
     * @protected
     * @param {String} name The collection name.
     * @return {Promise} Whether it went OK.
     */
    protected unlinkFrom(name: string): Promise {
        this.updated(name, true);
        return this.db.unlink(name, this._id);
    }

    /**
     * Says to the Datasource we have changed.
     * @function updated
     * @protected
     * @param {String} name Collection hosting.
     * @param {Boolean} deleted Deleted or not.
     */
    protected updated(name: string, deleted?: boolean) {
        deleted = deleted || false;
        this.db.updated(this._id, name, deleted);
    }

    protected abstract allFields(): any
    abstract persist()
    abstract sanitarize()
    abstract unlink(): Promise

}