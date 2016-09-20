/**
 * Component displaying the welcome screen.
 * @module profile.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ backend.profile._id }}</h2>
        <button type="button" class="btn btn-primary" (click)="logout(false)">{{ 'profile.logout' | translate }}</button>
        <button type="button" class="btn btn-danger" (click)="logout(true)">{{ 'profile.logoutAll' | translate }}</button>
        <br /><br />

        <button type="button" class="btn btn-primary" (click)="router.navigate(['/filesystem', 'data'])">{{ 'profile.mine' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="router.navigate(['/filesystem', 'vault'])">{{ 'profile.shared' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="router.navigate(['/generics'])">{{ 'profile.generics' | translate }}</button>
        <br /><br />

        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'profile.change' | translate }}</h3>
            </div>
            <div class="form-group">
                {{ 'profile.current' | translate }}<br />
                <input type="password" [(ngModel)]="current_pwd" name="n0" class="form-control" required>
            </div>
            <div class="checkbox">
                <label><input type="checkbox" name="n90" [(ngModel)]="use_pwd" checked> {{ 'login.use_pwd' | translate }}</label>
            </div>
            <div class="form-group">
                {{ 'profile.new' | translate }}<br />
                <input type="password" [(ngModel)]="password" name="n4" class="form-control" [disabled]="!use_pwd" required>
            </div>
            <div class="form-group">
                {{ 'profile.new' | translate }}<br />
                <input type="password" [(ngModel)]="password2" name="n5" class="form-control" [disabled]="!use_pwd" required>
            </div>
            <div class="form-group">
                {{ 'login.password_file' | translate }}<br />
                <input type="file" (change)="fileLoad($event)" name="n50" class="form-control" [disabled]="use_pwd" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary" (click)="update()">{{ 'profile.change' | translate }}</button>
            </div>
        </form>
        <br /><br />

        <merge-account></merge-account>
        <br /><br />

        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'profile.revoke' | translate }}</h3>
            </div>
            <div class="form-group">
                {{ 'profile.revokeID' | translate }}<br />
                <input type="text" [(ngModel)]="revoke_id" name="n100" class="form-control" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-warning" (click)="revokeAll()">{{ 'profile.revoke' | translate }}</button>
            </div>
        </form>
        <br /><br />

        <div class="heading">
            <h3 class="form-signin-heading">{{ 'profile.oauth' | translate }}</h3>
        </div>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>{{ 'oauth.for_id' | translate }}</th>
                        <th>{{ 'oauth.prefix' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let d of backend.profile.oauth">
                        <td>{{ d.for_id }}</td>
                        <td>{{ d.prefix }}</td>
                        <td><button type="button" class="btn btn-alarm" (click)="remove(d.id)">{{ 'remove' | translate }}</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <br /><br />

        <user-info [user]="backend.profile"></user-info>
        <br />
    `
})
export class Profile implements OnInit {

    public current_pwd: string;
    public password: string;
    public password2: string;
    public ask_data: string;
    public revoke_id: string;
    public use_pwd: boolean;
    private onEid: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend Backend service.
     * @param router Router service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend,
        private router: Router, private dataservice: Data) {
        this.use_pwd = true;
        this.onEid = true;
    }

    /**
     * Called upon displaying.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        if(this.onEid && /eidok/.test(window.location.href)) {
            //Back from eID
            this.onEid = false;
            this.notif.success(this.translate.instant('success'), this.translate.instant('profile.eidRead'));
            this.backend.getProfile().then(function(profile) {
                self.backend.profile = profile;
                self.dataservice.newData('profile/address/eid', self.backend.profile.company_info.address, false, 0).then(function() {
                    self.dataservice.newData('profile/rrn', self.backend.profile.company_info.rrn, false, 0);
                });
            });
        }
        this.dataservice.listData().then(function() {
            if(!!localStorage.getItem('return_url') && localStorage.getItem('return_url').length > 1) {
                var ret = localStorage.getItem('return_url');
                ret = JSON.parse(ret);
                localStorage.removeItem('return_url');
                self.router.navigate(ret);
            }
        });
    }

    /**
     * Log out.
     * @function logout
     * @public
     * @param {Boolean} all To log out all tokens.
     */
    logout(all: boolean) {
        var self = this;
        this.backend.removeTokens(all).then(function() {
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            localStorage.removeItem('psha');
            self.backend.forceReload();
            delete self.backend.profile;
            self.router.navigate(['/']);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
        });
    }

    /**
     * Remove a granted OAuth token.
     * @function remove
     * @public
     * @param {String} id Token id.
     */
    remove(id: string) {
        var self = this;
        this.backend.removeOAuth(id).then(function() {
            for(var i = 0; i < self.backend.profile.oauth.length; i++) {
                if(self.backend.profile.oauth[i].id == id) {
                    delete self.backend.profile.oauth[i];
                    break;
                }
            }
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noRevoke'));
        });
    }

    /**
     * Updates the profile.
     * @function update
     * @public
     */
    update() {
        var self = this;
        if(this.password.length < 8) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
            return;
        }
        if(this.password == this.password2) {
            this.backend.updateProfile(this.password, this.current_pwd).then(function() {
                self.dataservice.modifyData('keys/pwd/mine1', self.password.slice(0, 4), false, self.backend.profile.data['keys/pwd/mine1'].shared_to).then(function() {
                    self.dataservice.modifyData('keys/pwd/mine2', self.password.slice(4), false, self.backend.profile.data['keys/pwd/mine2'].shared_to).then(function() {
                        self.current_pwd = '';
                        self.password = '';
                        self.password2 = '';
                        self.notif.success(self.translate.instant('success'), self.translate.instant('profile.changed'));
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('profile.warnChange'));
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('profile.warnChange'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noChange'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
        }
    }

    /**
     * Revoke all accesses.
     * @function revokeAll
     * @public
     */
    revokeAll() {
        var self = this, keys = Object.getOwnPropertyNames(this.backend.profile.data);
        this.backend.getUser(this.revoke_id).then(function(user) {
            keys.forEach(function(val) {
                if(user._id in self.backend.profile[val].shared_to) {
                    self.backend.revokeVault(self.backend.profile.data[val].shared_to[user._id]).then(function() {
                        delete self.backend.profile.data[val].shared_to[user._id];
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noRevoke'));
                    });
                }
            });
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.noUser'));
        });
    }

    /**
     * Loads a file as password.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     */
    fileLoad(e: any) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            if(/^data:;base64,/.test(r.result))
                self.password = atob(r.result.split(',')[1]);
            else
                self.password = r.result;
            self.password2 = self.password;
        }
        r.readAsText(file);
    }
    
}
