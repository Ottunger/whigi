/**
 * Component to ask for a remote account creation.
 * @module account.component
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
        <h2>{{ 'account.question' | translate }}</h2>
        <br />
        <p>{{ 'account.explain' | translate }}</p>
        <br />
        <p>{{ 'account.id_to' | translate }}{{ id_to }}</p>
        <br />
        <p *ngIf="with_account">{{ 'account.withAccount' | translate }}</p>
        <br />
        <p *ngIf="!forever">{{ 'account.until' | translate }}<input [ngModel]="expire_epoch.toLocaleString()" datetime-picker [disabled]="true" class="form-control"></p>
        <p *ngIf="forever">{{ 'account.forever' | translate }}</p>
        <br />

        <div *ngFor="let p of data_list">
            <h3>{{ 'account.prefix' | translate }}{{ p }}</h3>
            <p *ngIf="!!backend.profile.data[p]">{{ 'account.shared' | translate }}</p>
            <input *ngIf="!backend.profile.data[p] && !!backend.generics[p] && !backend.generics[p].is_file" type="text" [(ngModel)]="new_data[p]" class="form-control">
            <input *ngIf="!backend.profile.data[p] && !!backend.generics[p] && backend.generics[p].is_file" type="file" (change)="fileLoad($event, p)" class="form-control">
            <p *ngIf="!backend.profile.data[p] && !backend.generics[p]"><i>{{ 'account.notShared' | translate }}</i></p>
        </div>
        <br />

        <button type="button" class="btn btn-warning" (click)="finish(true)" [disabled]="!ready">{{ 'account.ok' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="finish(false)" [disabled]="!ready">{{ 'account.nok' | translate }}</button>
        <br /><br />

        <user-info [user]="requester"></user-info>
    `
})
export class Account implements OnInit, OnDestroy {

    public ready: boolean;
    public id_to: string;
    public data_list: string[];
    public return_url_ok: string;
    public return_url_deny: string;
    public expire_epoch: Date;
    public requester: any;
    public new_data: {[id: string]: string};
    public forever: boolean;
    public trigger: string;
    public with_account: boolean;
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
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private router: Router, private notif: NotificationsService,
        private routed: ActivatedRoute, private backend: Backend, private dataservice: Data, private check: ApplicationRef) {
        this.requester = {};
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
            self.ready = false;
            self.id_to = window.decodeURIComponent(params['id_to']);
            self.return_url_ok = window.decodeURIComponent(params['return_url_ok']);
            self.return_url_deny = window.decodeURIComponent(params['return_url_deny']);
            self.with_account = params['with_account'] === 'true';
            self.trigger = (!!params['trigger'])? window.decodeURIComponent(params['trigger']) : '';
            self.expire_epoch = (!!params['expire_epoch'])? new Date(parseInt(params['expire_epoch'])) : new Date(0);
            self.forever = self.expire_epoch.getTime() < (new Date).getTime();
            
            //We prepare HTTPS
            if(!/^https/.test(self.return_url_ok)) {
                window.location.href = self.return_url_deny;
            }
            var parts = self.return_url_ok.split('https://');
            if(parts.length == 3) {
                self.return_url_ok = 'https://' + parts[1] + window.encodeURIComponent('https://' + parts[2]);
            }

            //List data, check if permissions already granted
            self.dataservice.listData().then(function() {
                var all = true;
                self.ready = true;
                self.data_list = (!!params['data_list'] && params['data_list'] != '-')? window.decodeURIComponent(params['data_list']).split('//') : [];
                for(var i = 0; i < self.data_list.length; i++) {
                    if(!(self.data_list[i] in self.backend.profile.data) || !(self.id_to in self.backend.profile.data[self.data_list[i]].shared_to)) {
                        all = false;
                        break;
                    }
                }
                if(all && (!self.with_account || ('keys/auth/' + self.id_to in self.backend.profile.data &&
                    self.id_to in self.backend.profile.data['keys/auth/' + self.id_to].shared_to))) {
                    window.location.href = self.return_url_ok;
                }
            }, function() {
                window.location.href = self.return_url_deny;
            });
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
     * @param {Boolean} ok True if create account.
     */
    finish(ok: boolean) {
        var self = this, acc: Promise, grant: Promise;
        if(ok) {
            acc = new Promise(function(resolve, reject) {
                if(!self.with_account) {
                    resolve();
                } else {
                    var key = self.backend.generateRandomString(64);
                    self.dataservice.newData('keys/auth/' + self.id_to, key, false, true).then(function(dummy) {
                        self.dataservice.grantVault(self.id_to, 'keys/auth/' + self.id_to, key, new Date(0)).then(function(dummy) {
                            resolve();
                        }, function(e) {
                            reject(e);
                        });
                    }, function(e) {
                        reject(e);
                    });
                }
            });
            grant = new Promise(function(resolve, reject) {
                var promises: Promise[] = [];
                self.data_list.forEach(function(adata) {
                    if(!(adata in self.backend.profile.data) && adata in self.backend.generics) {
                        if(self.backend.generics[adata].is_dated) {
                            self.new_data[adata] = JSON.stringify([{
                                value: self.new_data[adata],
                                from: 0
                            }]);
                        }
                        self.dataservice.newData(adata, self.new_data[adata], self.backend.generics[adata].is_dated).then(function(data) {
                            promises.push(self.dataservice.grantVault(self.id_to, adata, self.new_data[adata], self.expire_epoch, self.trigger));
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('account.err'));
                        });
                    } else {
                        self.backend.getData(self.backend.profile.data[adata].id).then(function(data) {
                            self.backend.decryptAES(self.backend.str2arr(data.encr_data), self.dataservice.workerMgt(false, function(got) {
                                promises.push(self.dataservice.grantVault(self.id_to, adata, got, self.expire_epoch, self.trigger));
                            }));
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('account.err'));
                        });
                    }
                });
                Promise.all(promises).then(function() {
                    resolve();
                }, function(e) {
                    reject(e);
                });
            });
            Promise.all([acc, grant]).then(function() {
                window.location.href = self.return_url_ok;
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('account.err'));
                window.setTimeout(function() {
                    window.location.href = self.return_url_deny;
                }, 1500);
            });
        } else {
            window.location.href = self.return_url_deny;
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
