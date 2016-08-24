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
import {NotificationsService} from 'notifications';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ backend.profile.username }}</h2>
        <button type="button" class="btn btn-primary" (click)="logout()">{{ 'profile.logout' | translate }}</button>
        <br />

        <div class="table-responsive">
        <table class="table table-condensed table-bordered">
            <thead>
                <tr>
                    <th>{{ 'profile.data_name' | translate }}</th>
                    <th>{{ 'profile.data' | translate }}</th>
                    <th>{{ 'action' | translate }}</th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let d of dataNames()">
                    <td>{{ d }}</td>
                    <td><i>{{ 'profile.mix' | translate }}</i></td>
                    <td><button type="button" class="btn btn-default" (click)="view(d)">{{ 'profile.goTo' | translate }}</button></td>
                </tr>
                <tr>
                    <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                    <td><input type="text" [(ngModel)]="data_value" name="s1" class="form-control"></td>
                    <td><button type="button" class="btn btn-default" (click)="register()">{{ 'profile.record' | translate }}</button></td>
                </tr>
            </tbody>
        </table>
    `
})
export class Profile implements OnInit {

    public data_name: string;
    public data_value: string;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService) {
        this.data_name = '';
        this.data_value = '';
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.backend.listData().then(function(add) {
            self.backend.profile.data = add.data;
            self.backend.profile.shared_with_me = add.shared_with_me;
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noData'));
        });
    }

    /**
     * Log out.
     * @function logout
     * @public
     */
    logout() {
        var self = this;
        this.backend.removeTokens().then(function() {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('key_decryption');
            self.router.navigate(['/']);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     */
    register() {
        var self = this;
        var garbled = this.backend.encryptAES(this.data_value);
        this.backend.postData(this.data_name, garbled).then(function(res) {
            self.backend.profile.data[self.data_name] = {
                id: res._id,
                length: 0,
                shared_to: {}
            }
            self.data_name = '';
            self.data_value = '';
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noRef'));
        });
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @return {Array} Known fields.
     */
    dataNames(): string[] {
        var keys = [];
        for (var key in this.backend.profile.data) {
            if (this.backend.profile.data.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Navigate to details panel.
     * @function view
     * @public
     * @return {String} name Name of data.
     */
    view(name: string) {
        this.router.navigate(['/data', name]);
    }

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(window.confirm(msg));
        });
    }
    
}
