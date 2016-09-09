/**
 * Component displaying public info about a user.
 * @module vaultview.component
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
enableProdMode();

@Component({
    template: `
        <h2>{{ 'userinfo.title' | translate }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />

        <user-info [user]="user"></user-info>
    `
})
export class User implements OnInit, OnDestroy {

    public user: any;
    public id: string;
    public ret: string[];
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param backend API service.
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(private translate: TranslateService, private router: Router, private backend: Backend,
        private notif: NotificationsService, private routed: ActivatedRoute) {
        this.user = {};
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.id = window.decodeURIComponent(params['id']);
            self.ret = !!params['ret']? JSON.parse(window.decodeURIComponent(params['ret'])) : ['/profile'];
            self.backend.getUser(self.id).then(function(user) {
                self.user = user;
            }, function(e) {
                self.back();
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
     * Back to profile.
     * @function back
     * @public
     */
    back() {
        this.router.navigate(this.ret);
    }
    
}
