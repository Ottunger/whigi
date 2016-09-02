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
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private dataservice: Data) {

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
            self.dataservice.newData(self.key, self.value, params['is_dated']).then(function() {
                self.notif.success(self.translate.instant('success'), self.translate.instant('savekey.rec'));
                window.location.href = self.return_url;
            }, function(err) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
                window.location.href = self.return_url;
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
