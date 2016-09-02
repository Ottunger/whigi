/**
 * Component to display the public info of a user.
 * @module userinfo.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
enableProdMode();

@Component({
    selector: 'user-info',
    template: `
        <h2>{{ 'userinfo.title' | translate }}</h2>
        <br />
        <p>{{ 'userinfo.trustLevel' | translate }}{{ requester.is_company }}</p>
        <br />
        <p>{{ 'userinfo.public' | translate }}{{ requester.company_info }}</p>
        <br />

        <button type="button" class="btn btn-alarm" (click)="finish(true)">{{ 'oauth.ok' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="finish(false)">{{ 'oauth.nok' | translate }}</button>
        <br /><br />

        <user-info [user]="requester"></user-info>
    `
})
export class Userinfo {

    @Input() requester: any;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService) {

    }

}
