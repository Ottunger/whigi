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

    /**
     * Creates a data fragment, we never know what encr_data actually is.
     * @function constructor
     * @public
     * @param _id The id.
     * @param encr_data Data.
     * @param db DB behind.
     */
    constructor(_id: string, public encr_data: string, public version: number, public encr_aes: string, db: Datasource) {
        super(_id, db);
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
            encr_data: this.encr_data,
            version: this.version,
            encr_aes: this.encr_aes
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
        this.updated('datas');
        return new Promise(function(resolve, reject) {
            self.db.getDatabase().collection('datas').update({_id: self._id}, self.allFields(), {upsert: true}, function(err) {
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
        return this.unlinkFrom('datas');
    }

}
