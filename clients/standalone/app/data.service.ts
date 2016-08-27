/**
 * Service play with data of the auth'd user.
 * @module data.service
 * @author Mathonet Grégoire
 */

'use strict';
import {Injectable, ApplicationRef} from '@angular/core';
import {NotificationsService} from 'angular2-notifications';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from './app.service';

@Injectable()
export class Data {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param http HTTP service.
     * @param router Routing service.
     * @param backend Backend service.
     */
    constructor(private notif: NotificationsService, private translate: TranslateService, private backend: Backend,
        private check: ApplicationRef) {

    }

    /**
     * Manages a worker.
     * @function workerMgt
     * @public
     * @param {Boolean} encrypt Encryption or not.
     * @param {Function} callback Callback to call with result.
     * @return {Function} Worker onmessage implementation.
     */
    workerMgt(encrypt: boolean, callback: Function) {
        var self = this;
        return function(msg) {
            switch(msg.data[0]) {
                case 1:
                    self.notif.remove();
                    self.notif.info(self.translate.instant(encrypt? 'encrypting' : 'decrypting'), msg.data[1] + ' %', {
                        timeout: 300,
                        showProgressBar: false
                    });
                    self.check.tick();
                    break;
                case 2:
                    callback(msg.data[1]);
                    break;
                case 0:
                default:
                    break;
            }
        }
    }

    /**
     * Store the user data's.
     * @function listData
     * @public
     */
    listData(): void {
        var self = this;
        this.backend.listData().then(function(add) {
            self.backend.profile.data = add.data;
            self.backend.profile.shared_with_me = add.shared_with_me;
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('noData'));
        });
    }

    /**
     * Register a new data.
     * @function newData
     * @public
     * @param {String} name Complete name, directory prefixed.
     * @param {String} value Value.
     * @param {Boolean} ignore Ignore existing data, wiping it.
     * @return {Promise} Whether it went OK.
     */
    newData(name: string, value: string, ignore?: boolean): Promise {
        var self = this;
        ignore = ignore || false;

        return new Promise(function(resolve, reject) {
            if(!ignore && name in self.backend.profile.data) {
                reject('exists');
                return;
            }
            self.backend.encryptAES(value, self.workerMgt(true, function(got) {
                self.backend.postData(name, got).then(function(res) {
                    self.backend.profile.data[name] = {
                        id: res._id,
                        length: 0,
                        shared_to: {}
                    }
                    resolve();
                }, function(e) {
                    reject('server');
                });
            }));
        });
    }

    /**
     * Modify a data and associated vaults.
     * @function modifyData
     * @public
     * @param {String} name Complete name, directory prefixed.
     * @param {String} value Value.
     * @param {Object} vault_ids A dictionary to fill user id => vault id. Must contain user id => email.
     * @return {Promise} Whether it went OK.
     */
    modifyData(name: string, value: string, vault_ids: any): Promise {
        var i = 0, names = keys(), max = names.length, went = true;
        var self = this;

        function keys(): string[] {
            var keys = [];
            for (var key in vault_ids) {
                if (vault_ids.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        }
        function check(ok, nok) {
            i++;
            if(i >= max) {
                if(went)
                    ok();
                else
                    nok('vault');
            }
        }
        
        return new Promise(function(resolve, reject) {
            self.newData(name, value, true).then(function() {
                names.forEach(function(id) {
                    self.grantVault(vault_ids[id], name, value).then(function(user, newid) {
                        vault_ids[id] = newid;
                        check(resolve, reject);
                    }, function() {
                        went = false;
                        check(resolve, reject);
                    });
                });
            }, function(err) {
                reject(err);
            });
        });
    }

    /**
     * Retrieve a vault a the associated user.
     * @function getVaultAndUser
     * @public
     * @param {String} email User email.
     * @param {String} id Vault id.
     * @return {Promise} Responses decrypted.
     */
    getVaultAndUser(email: string, id: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.getUser(email).then(function(user) {
                self.backend.getVault(id).then(function(vault) {
                    var aesKey: number[] = self.backend.decryptRSA(vault.aes_crypted_shared_pub);
                    self.backend.decryptAES(vault.data_crypted_aes, self.workerMgt(false, function(got) {
                        resolve(user, vault, got);
                    }), aesKey);
                }, function(e) {
                    reject();
                });
            }, function(e) {
                reject();
            });
        });
    }

    /**
     * Grants access to a data, creating a vault.
     * @function grantVault
     * @public
     * @param {String} email User email.
     * @param {String} name Data name.
     * @param {String} decr_data Decrypted data.
     * @return {Promise} Whether went OK with remote profile and newly created vault.
     */
    grantVault(email: string, name: string, decr_data: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.getUser(email).then(function(user) {
                var aesKey: number[] = self.backend.newAES();
                var aes_crypted_shared_pub: string = self.backend.encryptRSA(aesKey, user.rsa_pub_key);

                self.backend.encryptAES(decr_data, self.workerMgt(true, function(got) {
                    self.backend.createVault(name, user._id, got, aes_crypted_shared_pub).then(function(res) {
                        resolve(user, res._id);
                    }, function(e) {
                        reject();
                    });
                }), aesKey);
            }, function(e) {
                reject();
            });
        });
    }

    /**
     * Find all user details for the users listed.
     * @function populateUsers
     * @public
     * @param {String[]} User id's.
     * @return {Promise} To have a dictionary indexed by id's.
     */
    populateUsers(ids: string[]): Promise {
        var i = 0, max = ids.length;
        var ret = {}
        var self = this;

        function check(r) {
            i++;
            if(i >= max)
                r(ret);
        }

        return new Promise(function(resolve, reject) {
            ids.forEach(function(id) {
                self.backend.getUser(id).then(function(data) {
                    ret[data._id] = data;
                    check(resolve);
                }, function() {
                    check(resolve);  
                });
            });
        });
    }

}