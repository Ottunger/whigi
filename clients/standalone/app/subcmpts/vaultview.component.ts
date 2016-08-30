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
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ dataservice.sanitarize(sharer.email + '/' + vault.data_name) }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />

        <p>{{ 'actual' | translate }}</p>
        <input id="decrypted" *ngIf="decr_data.length < 150" type="text" [ngModel]="decr_data" class="form-control" readonly>
        <input id="decrypted" *ngIf="decr_data.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
        <button type="button" class="btn btn-primary" [disabled]="decr_data==''" (click)="dl()">{{ 'download' | translate }}</button>
        <button type="button" class="btn btn-primary btn-copier" data-clipboard-target="#decrypted">{{ 'copy' | translate }}</button>
        <br />
    `
})
export class Vaultview implements OnInit, OnDestroy {

    public sharer: any;
    public vault: any;
    public decr_data: string;
    private route_back: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notifications service.
     * @param routed Parameters service.
     */
    constructor(private translate: TranslateService, private router: Router, private backend: Backend,
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data) {
        this.vault = {data_name: ''};
        this.decr_data = '';
        new window.Clipboard('.btn-copier');
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.route_back = params['route_back'];
            self.sharer = self.backend.profile.sharer;
            self.dataservice.getVault(params['id']).then(function(vault, decr_data) {
                self.vault = vault;
                self.decr_data = decr_data;
            }, function() {
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
        this.router.navigate(['/filesystem', 'vault', (!!this.route_back)? {folders: this.route_back} : {}]);
    }

    /**
     * Prompts for downloading.
     * @function dl
     * @public
     */
    dl() {
        window.open('data:application/octet-stream,' + window.encodeURIComponent(this.decr_data), 'data');
    }
    
}
