/**
 * Component to merge two users into one.
 * @module merge.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, ApplicationRef} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    selector: 'merge-account',
    template: `
        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'merge.title' | translate }}</h3>
                <p>{{ 'merge.explain' | translate }}</p>
            </div>
            <div class="form-group">
                {{ 'merge.login' | translate }}<br />
                <input type="text" [(ngModel)]="login" name="y1" class="form-control">
            </div>
            <div class="form-group">
                {{ 'merge.pass' | translate }}<br />
                <input type="password" [(ngModel)]="password" name="y0" class="form-control">
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label><input type="checkbox" [(ngModel)]="erase" name="y2"> {{ 'merge.erase' | translate }}</label>
                </div>
                <button type="submit" class="btn btn-danger" (click)="merge()">{{ 'merge.merge' | translate }}</button>
            </div>
        </form>
    `
})
export class Merge {

    public login: string;
    public password: string;
    public erase: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend App service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend,
        private dataservice: Data, private check: ApplicationRef) {
        this.erase = false;
    }

    /**
     * Merges another account.
     * @function merge
     * @public
     */
    merge() {
        var self = this;
        var currentToken = localStorage.getItem('token'), newToken;
        var currentKey = localStorage.getItem('key_decryption'), newKey;
        this.backend.decryptMaster();
        var my_master = this.backend.master_key, my_id = this.backend.profile._id;
        this.backend.forceReload();

        if(this.backend.profile._id == this.login) {
            this.login = '';
            this.password = '';
        }

        this.backend.createToken(this.login, this.password, false).then(function(ticket) {
            newToken = ticket._id;
            localStorage.setItem('token', newToken);
            self.backend.getProfile().then(function(profile) {
                self.backend.profile = profile;
                newKey = window.sha256(self.password + profile.salt);
                localStorage.setItem('key_decryption', newKey);
                
                self.backend.listData().then(function(add) {
                    var array: any[] = [], index = 0, mapping = {};
                    var datakeys = Object.getOwnPropertyNames(add.data);
                    for(var i = 0; i < datakeys.length; i++) {
                        if(datakeys[i].indexOf('keys/pwd/') != 0) {
                            array.push({
                                mode: 'get',
                                name: datakeys[i],
                                index: 0,
                                is_dated: add.data[datakeys[i]].is_dated,
                                shared_to: add.data[datakeys[i]].shared_to,
                            });
                        }
                    }
                    
                    function next() {
                        if(index < array.length) {
                            var work = array[index];
                            index++;
                            switch(work.mode) {
                                case 'get':
                                    self.backend.getData(add.data[work.name].id).then(function(data) {
                                        var encr = self.backend.str2arr(data.encr_data);
                                        self.backend.decryptAES(encr, self.dataservice.workerMgt(false, function(got) {
                                            work.mode = 'getVault',
                                            work.version = data.version;
                                            work.decr_data = got;
                                            work.is_folder = (!!self.backend.generics[work.name.replace(/\/[^\/]*$/, '')] && self.backend.generics[work.name.replace(/\/[^\/]*$/, '')][data.version].is_folder);
                                            array.push(work);
                                            next();
                                        }));
                                    }, function(e) {
                                        self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                        self.reloadProfile(currentToken, currentKey);
                                    });
                                    break;
                                case 'getVault':
                                    if(work.shared_to.length > work.index) {
                                        var key = Object.getOwnPropertyNames(work.shared_to)[work.index];
                                        self.backend.getAccessVault(work.shared_to[key]).then(function(got) {
                                            work.shared_to[index] = {
                                                ee: new Date(got.expire_epoch),
                                                trigger: got.trigger
                                            };
                                            work.index++;
                                            array.push(work);
                                            next();
                                        }, function(e) {
                                            self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                            self.reloadProfile(currentToken, currentKey);
                                        });
                                    } else {
                                        work.mode = 'new';
                                        array.push(work);
                                        next();
                                    }
                                    break;
                                case 'new':
                                    self.dataservice.newData(work.name, work.decr_data, work.is_dated, work.version, self.erase).then(function() {
                                        work.mode = 'giveVault',
                                        work.index = 0;
                                        array.push(work);
                                        next();
                                    }, function(e) {
                                        if(e == 'exists') {
                                            work.mode = 'giveVault',
                                            work.index = 0;
                                            array.push(work);
                                            next();
                                        } else {
                                            self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                            self.reloadProfile(currentToken, currentKey);
                                        }
                                    });
                                    break;
                                case 'giveVault':
                                    if(work.shared_to.length > work.index) {
                                        var key = Object.getOwnPropertyNames(work.shared_to)[work.index];
                                        self.dataservice.grantVault(key, work.is_folder? work.name.replace(/\/[^\/]*$/, '') : work.name, work.name, work.decr_data, work.version, work.shared_to[key].ee, work.shared_to[key].trigger).then(function() {
                                            work.index++;
                                            array.push(work);
                                            next();
                                        }, function(e) {
                                            self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                            self.reloadProfile(currentToken, currentKey);
                                        });
                                    } else {
                                        next();
                                    }
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            self.backend.closeTo(my_id, my_master).then(function() {
                                self.notif.success(self.translate.instant('success'), self.translate.instant('merge.merged'));
                                self.login = '';
                                self.password = '';
                                self.reloadProfile(currentToken, currentKey);
                            }, function(e) {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('merge.noMerge'));
                                self.reloadProfile(currentToken, currentKey);
                            })
                        }
                    }
                    next();
                });
            });
        });
    }

    /**
     * Reload my profile.
     * @function reloadProfile
     * @private
     * @param {String} ct Current token.
     * @param {String} ck Current key.
     */
    private reloadProfile(ct: string, ck: string) {
        var self = this;
        localStorage.setItem('token', ct);
        localStorage.setItem('key_decryption', ck);
        this.backend.forceReload();

        this.check.tick();
        this.backend.getProfile().then(function(profile) {
            self.backend.profile = profile;
            self.check.tick();
            self.dataservice.listData();
        }, function(e) {
            delete self.backend.profile;
            self.notif.success(self.translate.instant('success'), self.translate.instant('merge.relog'));
        });
    }

}
