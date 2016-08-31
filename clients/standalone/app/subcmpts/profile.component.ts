/**
 * Component displaying the welcome screen.
 * @module profile.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ backend.profile.username }}</h2>
        <button type="button" class="btn btn-primary" (click)="logout(false)">{{ 'profile.logout' | translate }}</button>
        <button type="button" class="btn btn-danger" (click)="logout(true)">{{ 'profile.logoutAll' | translate }}</button>
        <br /><br />

        <button type="button" class="btn btn-primary" (click)="router.navigate(['/filesystem', 'data'])">{{ 'profile.mine' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="router.navigate(['/filesystem', 'vault'])">{{ 'profile.shared' | translate }}</button>
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
                <div class="checkbox">
                    <label><input type="checkbox" name="n9" [(ngModel)]="backend.profile.preferences.email_on_share">{{ 'profile.email_on_share' | translate }}</label>
                </div>
                <button type="submit" class="btn btn-primary" (click)="update()">{{ 'profile.change' | translate }}</button>
            </div>
        </form>
        <br /><br />

        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'profile.ask' | translate }}</h3>
            </div>
            <div class="form-group">
                {{ 'profile.askMail' | translate }}<br />
                <input type="text" [(ngModel)]="ask_email" name="n100" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'profile.askData' | translate }}<br />
                <input type="text" [(ngModel)]="ask_data" name="n40" class="form-control" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary" (click)="ask()">{{ 'profile.ask' | translate }}</button>
            </div>
        </form>
        <br /><br />

        <div class="table-responsive">
            <table class="table table-condensed table-bordered">
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
    `
})
export class Profile {

    public current_pwd: string;
    public password: string;
    public password2: string;
    public ask_email: string;
    public ask_data: string;
    public use_pwd: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend Backend service.
     * @param router Router service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend, private router: Router) {
        this.use_pwd = true;
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
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('key_decryption');
            window.location.href = '/';
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
        if(this.password == this.password2) {
            this.backend.updateProfile(this.password, this.backend.profile.preferences.email_on_share, this.current_pwd).then(function() {
                self.current_pwd = '';
                self.password = '';
                self.password2 = '';
                self.notif.success(self.translate.instant('success'), self.translate.instant('profile.changed'));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noChange'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noMatch'));
        }
    }

    /**
     * Ask a user for some of his data by mail.
     * @function ask
     * @public
     */
    ask() {
        var self = this;
        this.backend.ask(this.ask_email, this.ask_data).then(function() {
            self.ask_email = '';
            self.ask_data = '';
            self.notif.success(self.translate.instant('success'), self.translate.instant('profile.sent'));
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noSent'));
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
            self.password = r.result;
            self.password2 = r.result;
        }
        r.readAsText(file);
    }
    
}
