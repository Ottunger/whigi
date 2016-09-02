/**
 * Component displaying a reset help screen.
 * @module resethelp.component
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

    `
})
export class Resethelp implements OnInit, OnDestroy {

    private id: string;
    private data_name: string;
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
     * @param data Higher data service.
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
            self.id = window.decodeURIComponent(params['id']);
            self.data_name = window.decodeURIComponent(params['data_name']);
            self.dataservice.listData().then(function() {
                self.dataservice.getVault(self.backend.profile.shared_with_me[self.id][self.data_name]).then(function(vault, got) {
                    self.backend.mixRestore(self.id, got).then(function() {
                        self.router.navigate(['/profile']);
                    }, function() {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noHelp'));
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noHelp'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noHelp'));
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
