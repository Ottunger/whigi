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

    constructor(_id: string, db: Datasource) {
        this._id = _id;
        this.db = db;
    }

    protected abstract allFields()
    abstract persist()
    abstract sanitarize()

}