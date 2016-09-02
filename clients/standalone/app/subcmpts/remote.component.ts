/**
 * Component to auth user to 3rd party.
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
export class Remote implements OnInit, OnDestroy {

    private id_to: string;
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
     * @param backend Backend service.
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
            self.id_to = window.decodeURIComponent(params['id_to']);
            self.return_url = window.decodeURIComponent(params['return_url']);
            self.dataservice.listData().then(function() {
                if(self.backend.profile.shared_with_me[self.id_to] || !self.backend.profile.shared_with_me[self.id_to]['keys/auth/' + self.id_to]) {
                    window.location.href = self.return_url + '?response=null&user=' + self.backend.profile._id;
                }
                self.dataservice.getVault(self.backend.profile.shared_with_me[self.id_to]['keys/auth/' + self.id_to]).then(function(vault, got) {
                    window.location.href = self.return_url + '?response=' + got + '&user=' + self.backend.profile._id;
                }, function(e) {
                    window.location.href = self.return_url + '?response=null&user=' + self.backend.profile._id;
                });
            }, function(e) {
                window.location.href = self.return_url + '?response=null&user=' + self.backend.profile._id;
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