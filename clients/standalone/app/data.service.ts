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
import {Trie} from '../utils/Trie';

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
     * Return the structure directory of a data.
     * @function sanitarize
     * @public
     * @param {String} name Name of data.
     * @param {Boolean} folder If folder, not display end separator.
     * @return {String} Displayable string.
     */
    sanitarize(name: string, folder?: boolean): string {
        var parts: string[] = name.split('/');
        parts.unshift('/');
        var last = parts.pop();
        return parts.join(' > ') + (folder? '' : (' >> ' + last));
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
                    self.notif.remove();
                    self.notif.info(self.translate.instant(encrypt? 'encrypting' : 'decrypting'), '100 %', {
                        timeout: 300,
                        showProgressBar: false
                    });
                    callback(msg.data[1]);
                    break;
                case 3:
                    self.notif.remove();
                    self.notif.error(self.translate.instant(encrypt? 'encrypting' : 'decrypting'), self.translate.instant('corruption'));
                    console.log(JSON.parse(msg.data[1]));
                    callback('[]');
                    break;
                case 0:
                default:
                    break;
            }
        }
    }

    /**
     * Store the user data's. Build the trie's for data and whared_with_me.
     * @function listData
     * @public
     * @return {Promise} Promise.
     */
    listData(): Promise {
        var self = this;

        return new Promise(function(resolve, reject) {
            if(self.backend.data_loaded)
                resolve();

            self.backend.data_trie = new Trie();
            self.backend.shared_with_me_trie = new Trie();
            self.backend.listData().then(function(add) {
                self.backend.profile.data = add.data;
                self.backend.profile.shared_with_me = add.shared_with_me;
                
                var keys = Object.getOwnPropertyNames(add.data);
                for(var i = 0; i < keys.length; i++) {
                    self.backend.data_trie.addMilestones(keys[i], '/');
                    self.backend.data_trie.add(keys[i], self.backend.profile.data[keys[i]]);
                }
                keys = Object.getOwnPropertyNames(add.shared_with_me);
                for(var i = 0; i < keys.length; i++) {
                    var insides = Object.getOwnPropertyNames(add.shared_with_me[keys[i]]);
                    for(var j = 0; j < insides.length; j++) {
                        self.backend.shared_with_me_trie.addMilestones(keys[i] + '/' + insides[j], '/');
                        self.backend.shared_with_me_trie.add(keys[i] + '/' + insides[j], self.backend.profile.shared_with_me[keys[i]][insides[j]]);
                    }
                }
                self.backend.data_loaded = true;
                resolve();
            }, function(e) {
                self.backend.profile.data = {};
                self.backend.profile.shared_with_me = {};
                self.backend.data_loaded = true;
                self.notif.error(self.translate.instant('error'), self.translate.instant('noData'));
                resolve();
            });
        });
    }

    /**
     * Register a new data.
     * @function newData
     * @public
     * @param {String} name Complete name, directory prefixed.
     * @param {String} value Value.
     * @param {Boolean} is_dated Dated field.
     * @param {Number} version Data version.
     * @param {Boolean} ignore Ignore existing data, wiping it.
     * @return {Promise} Whether it went OK.
     */
    newData(name: string, value: string, is_dated: boolean, version: number, ignore?: boolean): Promise {
        var self = this;
        ignore = ignore || false;

        return new Promise(function(resolve, reject) {
            if(!ignore && self.backend.data_trie.has(name)) {
                reject('exists');
                return;
            }
            self.backend.encryptAES(value, self.workerMgt(true, function(got) {
                self.backend.postData(name, got, version, is_dated).then(function(res) {
                    self.backend.profile.data[name] = {
                        id: res._id,
                        length: 0,
                        is_dated: is_dated,
                        shared_to: {}
                    }
                    self.backend.data_trie.addMilestones(name, '/');
                    self.backend.data_trie.add(name, self.backend.profile.data[name]);
                    resolve();
                }, function(e) {
                    reject('server');
                });
            }));
        });
    }

    /**
     * Removes a data and associated vaults.
     * @function remove
     * @public
     * @param {String} name Data name.
     * @return {Promise} Of whether went OK.
     */
    remove(name: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.removeData(name).then(function() {
                delete self.backend.profile.data[name];
                self.backend.data_trie.remove(name);
                resolve();
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Modify a data and associated vaults.
     * @function modifyData
     * @public
     * @param {String} name Complete name, directory prefixed.
     * @param {String} value Value.
     * @param {Boolean} is_dated Dated field.
     * @param {Number} version Data version.
     * @param {Object} users_mapping A dictionary that must contain user id => expire_epoch.
     * @param {Boolean} is_folder Whether to dump vault name into folder.
     * @return {Promise} Whether it went OK.
     */
    modifyData(name: string, value: string, is_dated: boolean, version: number, users_mapping: {[id: string]: Date}, is_folder?: boolean): Promise {
        var i = 0, names = keys(), max = names.length, went = true;
        var self = this;
        is_folder = !!is_folder? is_folder : false;

        function keys(): string[] {
            var keys = [];
            for (var key in users_mapping) {
                if (users_mapping.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        }
        function check(ok, nok) {
            i++;
            if(i >= max) {
                self.listData();
                if(went)
                    ok();
                else
                    nok('vault');
            }
        }
        
        self.backend.triggerVaults(name);
        return new Promise(function(resolve, reject) {
            self.newData(name, value, is_dated, version, true).then(function() {
                names.forEach(function(id) {
                    var time = !!users_mapping[id].getTime? users_mapping[id] : new Date(0);
                    self.grantVault(id, is_folder? name.replace(/\/[^\/]*$/, '') : name, name, value, version, time).then(function(user, newid) {
                        check(resolve, reject);
                    }, function() {
                        went = false;
                        check(resolve, reject);
                    });
                });
                if(names.length == 0)
                    resolve();
            }, function(err) {
                reject(err);
            });
        });
    }

    /**
     * Retrieve a vault.
     * @function getVault
     * @public
     * @param {String} id Vault id.
     * @return {Promise} Responses decrypted.
     */
    getVault(id: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.getVault(id).then(function(vault) {console.log(vault.aes_crypted_shared_pub);
                var aesKey: number[] = self.backend.decryptRSA(vault.aes_crypted_shared_pub);console.log(aesKey);
                self.backend.decryptAES(self.backend.str2arr(vault.data_crypted_aes), self.workerMgt(false, function(got) {
                    vault.decr_data = got;
                    resolve(vault);
                }), aesKey);
            }, function(e) {
                reject(e);
            });
        });
    }

    /**
     * Grants access to a data, creating a vault.
     * @function grantVault
     * @public
     * @param {String} id User id.
     * @param {String} name Data name.
     * @param {String} real_name Real data name.
     * @param {String} decr_data Decrypted data.
     * @param {Number} version Vault version.
     * @param {Date} max_date Valid until.
     * @param {String} new_trigger URL to trigger.
     * @return {Promise} Whether went OK with remote profile and newly created vault.
     */
    grantVault(id: string, name: string, real_name: string, decr_data: string, version: number, max_date: Date, new_trigger?: string): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.getUser(id).then(function(user) {
                var aesKey: number[] = self.backend.newAES();
                var aes_crypted_shared_pub: string = self.backend.encryptRSA(aesKey, user.rsa_pub_key);

                self.backend.encryptAES(decr_data, self.workerMgt(true, function(got) {
                    self.backend.createVault(name, real_name, user._id, got, aes_crypted_shared_pub, version,
                        (max_date.getTime() < (new Date).getTime())? 0 : max_date.getTime(), new_trigger).then(function(res) {
                        self.backend.profile.data[real_name].shared_to[user._id] = res._id;
                        resolve(user, res._id);
                    }, function(e) {
                        reject(e);
                    });
                }), aesKey);
            }, function(e) {
                reject(e);
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
            if(ids.length == 0)
                resolve({});
        });
    }

}