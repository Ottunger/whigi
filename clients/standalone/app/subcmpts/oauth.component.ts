/**
 * Component to demand the creation of an OAuth token.
 * @module oauth.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy, ApplicationRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <div style="box-shadow: 0 0 10px 10px black; padding: 10px;">
            <h2>{{ 'oauth.question' | translate }}</h2>
            <br />
            <p>{{ 'oauth.explain' | translate }}</p>
            <br />
            <p>{{ 'oauth.for_id' | translate }}{{ for_id }}</p>
            <br />
            <p>{{ 'oauth.prefix' | translate }}{{ prefix }}</p>
            <br />

            <button type="button" class="btn btn-warning" (click)="finish(true)">{{ 'oauth.ok' | translate }}</button>
            <button type="button" class="btn btn-primary" (click)="finish(false)">{{ 'oauth.nok' | translate }}</button>
            <br /><br />

            <user-info [user]="requester"></user-info>
        </div>
    `
})
export class Oauth implements OnInit, OnDestroy {

    public for_id: string;
    public prefix: string;
    public return_url_ok: string;
    public return_url_deny: string;
    public token: string;
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
     * @param backend Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private check: ApplicationRef) {
        this.requester = {};
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.for_id = params['for_id'];
            self.token = params['token'];
            self.prefix = window.decodeURIComponent(params['prefix']);
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            if(!/^https/.test(self.return_url_ok)) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=https']);
            }
            self.backend.getUser(self.for_id).then(function(user) {
                self.requester = user;
                self.check.tick();
            }, function(e) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=api']);
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
     * Adds query parameters to a URL.
     * @function mixin
     * @private
     * @param {String} url Base URL.
     * @param {String[]} params Key=Value mapping.
     * @return {String} New URL.
     */
    private mixin(url: string, params: string[]): string {
        var ps = params.join('&');
        return url + (url.indexOf('?') > 0)? '&' : '?' + ps;
    }

    /**
     * Called once the user has selected whether to accept or deny.
     * @function finish
     * @public
     * @param {Boolean} ok True if grant access.
     */
    finish(ok: boolean) {
        var self = this;
        if(ok) {
            this.backend.createOAuth(this.for_id, this.prefix, this.token).then(function(granted) {
                window.location.href = self.mixin(self.return_url_ok, ['token=' + granted._id, 'key_decryption=' + localStorage.getItem('key_decryption')]);
            }, function(e) {
                window.location.href = self.mixin(self.return_url_deny, ['reason=api']);
            });
        } else {
            window.location.href = self.mixin(this.return_url_deny, ['reason=deny']);
        }
    }

}
