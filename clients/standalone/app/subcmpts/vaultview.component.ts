/**
 * Component displaying a detailed view of a vault.
 * @module vaultview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ vault.data_name }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />

        <p>{{ 'actual' | translate }}</p>
        <input type="text" [(ngModel)]="decr_data" class="form-control" readonly>
        <button type="button" class="btn btn-primary" (click)="copy()">{{ 'copy' | translate }}</button>
        <br />
    `
})
export class Vaultview implements OnInit {

    public sharer: any;
    public vault: any;
    public decr_data: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router,
        private notif: NotificationsService, private routed: ActivatedRoute) {
        this.vault = {data_name: ''};
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            //Use params.email and params.name as key
            self.backend.getUser(params['email']).then(function(user) {
                self.sharer = user;
                self.backend.getVault(params['name'], user._id).then(function(vault) {
                    self.vault = vault;
                    var aesKey: number[] = self.backend.decryptRSA(vault.aes_crypted_shared_pub);
                    self.decr_data = self.backend.decryptAES(vault.data_rypted_aes, aesKey);
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('vaultview.noData'));
                    self.back();
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('vaultview.noData'));
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
        this.router.navigate(['/profile']);
    }

    /**
     * Prompt for copy.
     * @function copy
     * @public
     */
    copy() {
        window.prompt(this.translate.instant('makeCopy'), this.decr_data);
    }
    
}