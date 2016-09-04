/**
 * Component to ask for a granting.
 * @module grant.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy, ApplicationRef} from '@angular/core';
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
        <p *ngIf="!forever">{{ 'grant.until' | translate }}<input [ngModel]="expire_epoch.toLocaleString()" datetime-picker [disabled]="true" class="form-control"></p>
        <p *ngIf="forever">{{ 'grant.forever' | translate }}</p>
        <br />

        <div *ngFor="let p of data_list">
            <h3>{{ 'grant.prefix' | translate }}{{ p }}</h3>
            <p *ngIf="!!backend.profile.data[p]">{{ 'grant.shared' | translate }}</p>
            <input *ngIf="!backend.profile.data[p] && !!backend.generics[p] && !backend.generics[p].is_file" type="text" [(ngModel)]="new_data[p]" class="form-control">
            <input *ngIf="!backend.profile.data[p] && !!backend.generics[p] && backend.generics[p].is_file" type="file" (change)="fileLoad($event, p)" class="form-control">
            <p *ngIf="!backend.profile.data[p] && !backend.generics[p]"><i>{{ 'grant.notShared' | translate }}</i></p>
        </div>
        <br />

        <button type="button" class="btn btn-warning" (click)="finish(true)">{{ 'grant.ok' | translate }}</button>
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
    public forever: boolean;
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
     * @param check: Check service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private dataservice: Data, private check: ApplicationRef) {
        this.new_data = {};
        this.requester = {};
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
            self.expire_epoch = new Date(parseInt(params['expire_epoch']));
            self.forever = self.expire_epoch.getTime() < (new Date).getTime();
            self.data_list = window.decodeURIComponent(params['data_list']).split('//');
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            self.backend.getUser(self.id_to).then(function(user) {
                self.requester = user;
                self.check.tick();
            }, function(e) {
                window.location.href = self.return_url_deny;
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
                if(!(this.data_list[i] in this.backend.profile.data) && this.data_list[i] in this.backend.generics) {
                    if(this.backend.generics[this.data_list[i]].is_dated) {
                        this.new_data[this.data_list[i]] = JSON.stringify([{
                            value: this.new_data[this.data_list[i]],
                            from: 0
                        }]);
                    }
                    this.dataservice.newData(this.data_list[i], this.new_data[this.data_list[i]], this.backend.generics[this.data_list[i]].is_dated).then(function(data) {
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
                window.location.href = self.return_url_ok;
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('grant.err'));
                window.setTimeout(function() {
                    window.location.href = self.return_url_deny;
                }, 1500);
            });
        } else {
            window.location.href = this.return_url_deny;
        }
    }

    /**
     * Loads a file as data.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     * @param {String} name The data name associated.
     */
    fileLoad(e: any, name: string) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            self.new_data[name] = r.result;
        }
        r.readAsDataURL(file);
    }

}
