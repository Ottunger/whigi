/**
 * Description of a mapping.
 * @module Mapping
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
import {Datasource} from '../Datasource';
import {IModel} from './IModel';

export class Mapping extends IModel {
    
    /**
     * Create a USer from a bare database description.
     * @function constructor
     * @public
     * @param id ID.
     * @param email Email of user.
     * @param master_key Master key of user.
     * @param time_changed Last time pwd_ket was created.
     * @param pwd_key Password key.
     * @param token A token suitable for logging on behalf of the user specified by this email.
     * @param bearer_id Id of owner.
     * @param safe Safe mapping.
     * @param recup_mail Recuperation mail for safe mappings.
     * @param db Database.
     */
    constructor(_id: string, public email: string, public master_key: string, public time_changed: number, public pwd_key: string,
        public token: string, public bearer_id: string, public safe: boolean, public recup_mail: string, public recup_mail2: string, db: Datasource) {
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
            email: this.email,
            master_key: this.master_key,
            pwd_key: this.pwd_key,
            time_changed: this.time_changed,
            token: this.token,
            bearer_id: this.bearer_id,
            safe: this.safe,
            recup_mail: this.recup_mail,
            recup_mail2: this.recup_mail2
        };
        return ret;
    }

    /**
     * Write the user to database.
     * @function persist
     * @public
     * @return A promise to check if everything went well.
     */
    persist() {
        var self = this;
        this.updated('mappings');
        return new Promise(function(resolve, reject) {
            self.db.getDatabase().collection('mappings').update({_id: self._id}, self.allFields(), {upsert: true}, function(err) {
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
        return this.unlinkFrom('mappings');
    }

}