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
        <h2>{{ dataservice.sanitarize(sharer_id + '/' + vault.data_name) }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />

        <clear-view [decr_data]="decr_data" [is_dated]="is_dated" [data_name]="vault.data_name" [change]="false" [is_generic]="is_generic" [version]="version"
            [is_folder]="is_generic && !!backend.generics[vault.data_name] && !!backend.generics[vault.data_name][version].json_keys" [gen_name]="vault.data_name"></clear-view>
    `
})
export class Vaultview implements OnInit, OnDestroy {

    public vault: any;
    public sharer_id: string;
    public decr_data: string;
    public is_dated: boolean;
    public is_generic: boolean;
    public version: number;
    private route_back: string;
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
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private router: Router, private backend: Backend,
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data) {
        this.vault = {data_name: ''};
        this.decr_data = '';
        this.is_generic = false;
        this.version = 0;
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
            self.sharer_id = params['username'];
            self.dataservice.getVault(params['id']).then(function(vault) {
                self.vault = vault;
                self.decr_data = vault.decr_data;
                self.is_dated = vault.is_dated;
                if(!!self.backend.generics[vault.data_name]) {
                    self.is_generic = true;
                    self.version = vault.version;
                }
            }, function(e) {
                if(e.status == 417)
                    self.notif.error(self.translate.instant('error'), self.translate.instant('vaultview.expired'));
                else
                    self.notif.error(self.translate.instant('error'), self.translate.instant('vaultview.noData'));
                delete self.backend.profile.shared_with_me[self.sharer_id][params['data_name']];
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
    
}
