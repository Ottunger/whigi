/**
 * Description of a data fragment.
 * @module Datafragment
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';
import {IModel} from './IModel';

export class Datafragment extends IModel {

    public encr_data: string;

    /**
     * Creates a data fragment, we never know what encr_data actually is.
     * @function constructor
     * @public
     * @param _id The id.
     * @param encr_data Data.
     * @param db DB behind.
     */
    constructor(_id: string, encr_data: string, db: Datasource) {
        super(_id, db);
        this._id = _id;
        this.encr_data = encr_data;
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @protected
     * @return Duplicated object.
     */
    protected allFields() {
        var ret = {
            _id: this._id,
            encr_data: this.encr_data
        };
        return ret;
    }

    /**
     * Write the data to database.
     * @function persist
     * @public
     * @return A promise to check if everything went well.
     */
    persist() {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            self.db.getDatabase().collection('datas').update({_id: self._id}, self.allFields(), {upsert: true}).then(function() {
                resolve();
            }, function(e) {
                reject(e);
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
        var ret = {
            encr_data: this.encr_data,
            _id: this._id
        };
        return ret;
    }

}
