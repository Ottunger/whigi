/**
 * Component displaying a detailed view of a data.
 * @module dataview.component
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
        <h2>{{ dataservice.sanitarize(data_name) }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />
        <p>{{ 'actual' | translate }}</p>
        <input id="decrypted" *ngIf="decr_data.length < 150" type="text" [ngModel]="decr_data" class="form-control" readonly>
        <input id="decrypted" *ngIf="decr_data.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
        <button type="button" class="btn btn-primary" [disabled]="decr_data==''" (click)="dl()">{{ 'download' | translate }}</button>
        <button type="button" class="btn btn-primary btn-copier" data-clipboard-target="#decrypted">{{ 'copy' | translate }}</button>
        <br /><br />

        <p>{{ 'modify' | translate }}</p>
        <input type="text" [(ngModel)]="new_data" [disabled]="new_data_file!=''" class="form-control">
        <input type="file" (change)="fileLoad($event)" class="form-control">
        <button type="button" class="btn btn-primary" (click)="modify()" [disabled]="!decr_data">{{ 'filesystem.record' | translate }}</button>
        <button type="button" class="btn btn-warning" (click)="revokeAll()">{{ 'dataview.revokeAll' | translate }}</button>
        <button type="button" class="btn btn-danger" (click)="remove()" [disabled]="data_name.startsWith('keys/')">{{ 'remove' | translate }}</button>
        <br /><br />

        <div class="table-responsive">
            <table class="table table-condensed table-bordered">
                <thead>
                    <tr>
                        <th>{{ 'dataview.shared_to' | translate }}</th>
                        <th>{{ 'dataview.until' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let d of sharedIds()">
                        <td>{{ d }}</td>
                        <td *ngIf="!!timings[d]">{{ timings[d].la }} - {{ timings[d].ee }}</td>
                        <td *ngIf="!timings[d]"></td>
                        <td><button type="button" class="btn btn-default" (click)="revoke(d)" [disabled]="!backend.profile.data[data_name].shared_to[d]">{{ 'remove' | translate }}</button></td>
                    </tr>
                    <tr>
                        <td><input type="text" [(ngModel)]="new_id" name="y0" class="form-control"></td>
                        <td><input [(ngModel)]="new_date" datetime-picker></td>
                        <td><button type="button" class="btn btn-default" (click)="register()" [disabled]="!decr_data">{{ 'record' | translate }}</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
})
export class Dataview implements OnInit, OnDestroy {

    public data: any;
    public data_name: string;
    public decr_data: string;
    public new_data: string;
    public new_data_file: string;
    public new_id: string;
    public new_date: string;
    public timings: {[id: string]: {la: Date, ee: Date}};
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
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data, private check: ApplicationRef) {
        this.decr_data = '';
        this.new_data_file = '';
        this.timings = {};
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
            //Use params.name as key
            self.data_name = window.decodeURIComponent(params['name']);
            var keys = Object.getOwnPropertyNames(self.backend.profile.data[self.data_name].shared_to);
            for(var i = 0; i < keys.length; i++) {
                self.backend.getAccessVault(self.backend.profile.data[self.data_name].shared_to[keys[i]]).then(function(got) {
                    self.timings[keys[i]] = {la: new Date(got.last_access), ee: new Date(got.expire_epoch)};
                }, function(e) {
                    delete self.backend.profile.data[self.data_name].shared_to[keys[i]];
                });
            }
            self.backend.getData(self.backend.profile.data[self.data_name].id).then(function(data) {
                self.data = data;
                self.data.encr_data = self.backend.str2arr(self.data.encr_data);
                self.backend.decryptAES(self.data.encr_data, self.dataservice.workerMgt(false, function(got) {
                    self.decr_data = got;
                    self.check.tick();
                }));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
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
     * Modifies the data.
     * @function modify
     * @public
     */
    modify() {
        var self = this, names = this.sharedIds(), dict: {[id: string]: Date} = {};

        for(var i = 0; i < names.length; i++) {
            dict[names[i]] = this.timings[names[i]].ee;
        }
        this.dataservice.modifyData(this.data_name, (this.new_data_file != '')? this.new_data_file : this.new_data, dict).then(function() {
            self.new_data = '';
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.exists'));
        });
    }

    /**
     * Removes a data.
     * @function remove
     * @public
     */
    remove() {
        var self = this;
        this.dataservice.remove(this.data_name).then(function() {
            self.back();
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
        });
    }

    /**
     * Keys of shared people array, which are user id's.
     * @function sharedIds
     * @public
     * @return {Array} Known fields.
     */
    sharedIds(): string[] {
        var keys = [];
        if(!this.backend.profile.data[this.data_name])
            return [];
        for(var key in this.backend.profile.data[this.data_name].shared_to) {
            if(this.backend.profile.data[this.data_name].shared_to.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Back to profile.
     * @function back
     * @public
     */
    back() {
        this.router.navigate(['/filesystem', 'data', {folders: this.data_name.replace(/[^\/]+$/, '')}]);
    }

    /**
     * Revoke an access.
     * @function revoke
     * @public
     * @param {String} shared_to_id Id of sharee.
     */
    revoke(shared_to_id: string) {
        var self = this;
        this.backend.revokeVault(this.backend.profile.data[this.data_name].shared_to[shared_to_id]).then(function() {
            delete self.backend.profile.data[self.data_name].shared_to[shared_to_id];
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
        });
    }

    /**
     * Revoke all accesses.
     * @function revokeAll
     * @public
     */
    revokeAll() {
        var self = this, keys = Object.getOwnPropertyNames(this.backend.profile[this.data_name].shared_to);
        for(var i = 0; i < keys.length; i++) {
            this.backend.revokeVault(this.backend.profile.data[this.data_name].shared_to[keys[i]]).then(function() {
                delete self.backend.profile.data[self.data_name].shared_to[keys[i]];
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
            });
        }
    }

    /**
     * Register a new grant.
     * @function register
     * @public
     */
    register() {
        var self = this;
        this.dataservice.grantVault(this.new_id, this.data_name, this.data.dec, new Date(this.new_date)).then(function(user, id) {
            self.backend.profile.data[self.data_name].shared_to[user._id] = id;
            self.timings[user._id] = {la: new Date(0), ee: new Date(this.new_date)};
            self.new_id = '';
        }, function() {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noGrant'));
        });
    }

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(window.confirm(msg));
        });
    }

    /**
     * Prompts for downloading.
     * @function dl
     * @public
     */
    dl() {
        var spl = this.data_name.split('/');
        window.download(this.decr_data, spl[spl.length - 1]);
    }

    /**
     * Loads a file as data.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     */
    fileLoad(e: any) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            self.new_data_file = r.result;
        }
        r.readAsDataURL(file);
    }
    
}
