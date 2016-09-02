/**
 * Component to ask for a remote account creation.
 * @module account.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ 'account.question' | translate }}</h2>
        <br />
        <p>{{ 'account.explain' | translate }}</p>
        <br />
        <p>{{ 'account.id_to' | translate }}{{ for_id }}</p>
        <br />

        <button type="button" class="btn btn-alarm" (click)="finish(true)">{{ 'account.ok' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="finish(false)">{{ 'account.nok' | translate }}</button>
        <br /><br />

        <user-info [user]="requester"></user-info>
    `
})
export class Account implements OnInit, OnDestroy {

    public id_to: string;
    public return_url_ok: string;
    public return_url_deny: string;
    public requester: any;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param backend Backend service.
     * @param data Data service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private dataservice: Data) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.id_to = window.decodeURIComponent(params['id_to']);
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            self.dataservice.listData();
            self.backend.getUser(self.id_to).then(function(user) {
                self.requester = user;
            });
        });
    }

    /**
     * Called upon destroy.
     * @function ngOnInit
     * @public
     */
    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    /**
     * Called once the user has selected whether to accept or deny.
     * @function finish
     * @public
     * @param {Boolean} ok True if create account.
     */
    finish(ok: boolean) {
        var self = this;
        if(ok) {
            var key = this.backend.generateRandomString(32);
            this.dataservice.newData('keys/auth/' + this.id_to, key, false, true).then(function(dummy) {
                self.dataservice.grantVault(self.id_to, 'keys/auth/' + self.id_to, key, new Date(0)).then(function(dummy) {
                    window.location.href = this.return_url_ok;
                }, function(e) {
                    window.location.href = this.return_url_deny;
                });
            }, function() {
                window.location.href = this.return_url_deny;
            });
        } else {
            window.location.href = this.return_url_deny;
        }
    }

}
