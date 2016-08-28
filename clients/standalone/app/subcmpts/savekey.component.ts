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

    private mail: string;
    private key_frg: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
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
            self.mail = window.decodeURIComponent(params['mail']);
            self.key_frg = params['key_frg'];
            self.dataservice.newData('keys/' + self.mail, self.key_frg).then(function() {
                self.notif.success(self.translate.instant('success'), self.translate.instant('savekey.rec'));
                self.router.navigate(['/profile']);
            }, function(err) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
                self.router.navigate(['/profile']);
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
