/**
 * Component register a key then moving to profile.
 * @module savekey.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Data} from '../data.service';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `

    `
})
export class Savekey implements OnInit, OnDestroy {

    private key: string;
    private value: string;
    private return_url: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param dataservice Data service.
     * @param backend App service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private dataservice: Data, private backend: Backend) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.key = window.decodeURIComponent(params['key']);
            self.value = window.decodeURIComponent(params['value']);
            self.return_url = window.decodeURIComponent(params['return_url']);
            if(self.key in self.backend.generics || (self.key.replace(/\/[^\/]*/, '') in self.backend.generics &&
                self.backend.generics[self.key.replace(/\/[^\/]*/, '')][self.backend.generics[self.key.replace(/\/[^\/]*/, '')].length - 1].is_folder))
                window.location.href = self.return_url;
            self.dataservice.newData(self.key, self.value, params['is_dated'], 0).then(function() {
                self.notif.success(self.translate.instant('success'), self.translate.instant('savekey.rec'));
                setTimeout(function() {
                    window.location.href = self.return_url;
                }, 1500);
            }, function(err) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
                setTimeout(function() {
                    window.location.href = self.return_url;
                }, 1500);
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

}
