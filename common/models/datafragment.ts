/**
 * Description of a data fragment.
 * @module datafragment
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../datasources';

export class Datafragment {

    public _id: string;
    public encr_data: string;
    private db: Datasource;

    /**
     * Creates a data fragment, we never know what encr_data actually is.
     * @function constructor
     * @public
     * @param _id The id.
     * @param encr_data Data.
     * @param db DB behind.
     */
    constructor(_id: string, encr_data: string, db: Datasource) {
        this._id = _id;
        this.encr_data = encr_data;
        this.db = db;
    }

    /**
     * Returns a shallow copy safe for persisting.
     * @function allFields
     * @private
     * @return Duplicated object.
     */
    private allFields() {
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
