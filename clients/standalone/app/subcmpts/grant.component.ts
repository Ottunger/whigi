/**
 * Component to ask for a granting.
 * @module grant.component
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
        <h2>{{ 'grant.question' | translate }}</h2>
        <br />
        <p>{{ 'grant.explain' | translate }}</p>
        <br />
        <p>{{ 'grant.id_to' | translate }}{{ id_to }}</p>
        <br />
        <h1 *ngFor="let p of data_list">{{ 'grant.prefix' | translate }}</h1>
        <p *ngIf="!!backend.profile.data[p]">{{ p }}</p>
        <input *ngIf="!backend.profile.data[p]" type="text" [(ngModel)]="new_data[p]" class="form-control">
        <br />

        <button type="button" class="btn btn-alarm" (click)="finish(true)">{{ 'grant.ok' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="finish(false)">{{ 'grant.nok' | translate }}</button>
        <br /><br />

        <user-info [user]="requester"></user-info>
    `
})
export class Grant implements OnInit, OnDestroy {

    public id_to: string;
    public data_list: string[];
    public return_url_ok: string;
    public return_url_deny: string;
    public expire_epoch: Date;
    public requester: any;
    public new_data: {[id: string]: string};
    public is_dated: boolean;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Activated route service.
     * @param backend Backend service.
     * @param data Data service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private dataservice: Data) {
        this.new_data = {};
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
            self.expire_epoch = new Date(params['expire_epoch']);
            self.data_list = window.decodeURIComponent(params['data_list']).split('//');
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            self.is_dated = params['is_dated'];
            self.dataservice.listData();
            self.backend.getUser(self.id_to).then(function(user) {
                self.requester = user;
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
     * Called once the user has selected whether to accept or deny.
     * @function finish
     * @public
     * @param {Boolean} ok True if grant access.
     */
    finish(ok: boolean) {
        var self = this;
        if(ok) {
            var promises: Promise[] = [];
            for(var i = 0; i < this.data_list.length; i++) {
                if(!(this.data_list[i] in this.backend.profile.data)) {
                    this.dataservice.newData(this.data_list[i], this.new_data[this.data_list[i]], this.is_dated).then(function(data) {
                        promises.push(self.dataservice.grantVault(self.id_to, self.data_list[i], self.new_data[self.data_list[i]], self.expire_epoch));
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('grant.err'));
                    });
                } else {
                    this.backend.getData(this.backend.profile.data[this.data_list[i]].id).then(function(data) {
                        self.backend.decryptAES(data.encr_data, self.dataservice.workerMgt(false, function(got) {
                            promises.push(self.dataservice.grantVault(self.id_to, self.data_list[i], got, self.expire_epoch));
                        }));
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('grant.err'));
                    });
                }
            }
            Promise.all(promises).then(function() {
                window.location.href = this.return_url_ok;
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('grant.err'));
                window.setTimeout(function() {
                    window.location.href = this.return_url_deny;
                }, 1500);
            });
        } else {
            window.location.href = this.return_url_deny;
        }
    }

}
