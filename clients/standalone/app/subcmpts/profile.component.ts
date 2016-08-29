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
    
}
