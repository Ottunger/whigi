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
    
}
