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
        <button type="button" class="btn btn-primary" (click)="back(false)">{{ 'back' | translate }}</button>
        <button *ngIf="!!backend.generics[data_name]" type="button" class="btn btn-primary" (click)="back(true)">{{ 'dataview.toGen' | translate }}</button>
        <br />
        <clear-view [decr_data]="decr_data" [is_dated]="is_dated" [data_name]="data_name" [change]="true" (notify)="mod($event, false)"></clear-view>
        <br /><br />

        <p *ngIf="!is_dated">{{ 'modify' | translate }}</p>
        <p *ngIf="!!is_dated && is_dated">{{ 'add' | translate }}</p>
        <input *ngIf="!!is_dated && is_dated" [(ngModel)]="new_date" datetime-picker class="form-control">
        <input type="text" [(ngModel)]="new_data" [disabled]="new_data_file!=''" class="form-control">
        <input type="file" (change)="fileLoad($event)" class="form-control">
        <button type="button" class="btn btn-primary" (click)="modify()" [disabled]="!decr_data">{{ 'filesystem.record' | translate }}</button>
        <button type="button" class="btn btn-warning" (click)="revokeAll()">{{ 'dataview.revokeAll' | translate }}</button>
        <button type="button" class="btn btn-danger" (click)="remove()"
                [disabled]="shared() || !!backend.generics[data_name]">{{ 'remove' | translate }}</button>
        <br /><br />

        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>{{ 'dataview.shared_to' | translate }}</th>
                        <th>{{ 'dataview.lastAccess' | translate }}</th>
                        <th>{{ 'dataview.until' | translate }}</th>
                        <th>{{ 'dataview.trigger' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let d of sharedIds()">
                        <td>{{ d }}</td>
                        <td *ngIf="!!timings[d] && timings[d].seen"><input [ngModel]="timings[d].la.toLocaleString()" datetime-picker [disabled]="true" class="form-control"></td>
                        <td *ngIf="!!timings[d] && timings[d].ends"><input [ngModel]="timings[d].ee.toLocaleString()" datetime-picker [disabled]="true" class="form-control"></td>
                        <td *ngIf="!!timings[d] && !timings[d].seen">{{ 'dataview.neverSeen' | translate }}</td>
                        <td *ngIf="!!timings[d] && !timings[d].ends">{{ 'dataview.forever' | translate }}</td>
                        <td *ngIf="!timings[d]"></td>
                        <td *ngIf="!timings[d]"></td>
                        <td *ngIf="!!timings[d]">{{ timings[d].trigger }}</td>
                        <td *ngIf="!timings[d]"></td>
                        <td><button type="button" class="btn btn-default" (click)="revoke(d)" [disabled]="!backend.profile.data[data_name].shared_to[d]">{{ 'remove' | translate }}</button></td>
                    </tr>
                    <tr>
                        <td><input type="text" [(ngModel)]="new_id" name="y0" class="form-control"></td>
                        <td></td>
                        <td><input [(ngModel)]="new_date" datetime-picker class="form-control"></td>
                        <td><input type="text" [(ngModel)]="new_trigger" name="y1" class="form-control"></td>
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
    public timings: {[id: string]: {la: Date, ee: Date, seen: boolean, ends: boolean, trigger: string}};
    public is_dated: boolean;
    public new_trigger: string;
    private to_filesystem: boolean;
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
        this.decr_data = '[]';
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
            self.to_filesystem = params['to_filesystem'];
            self.is_dated = self.backend.profile.data[self.data_name].is_dated;
            var keys = Object.getOwnPropertyNames(self.backend.profile.data[self.data_name].shared_to);
            keys.forEach(function(val) {
                self.backend.getAccessVault(self.backend.profile.data[self.data_name].shared_to[val]).then(function(got) {
                    self.timings[val] = {
                        la: new Date(parseInt(got.last_access)),
                        ee: new Date(parseInt(got.expire_epoch)),
                        seen: parseInt(got.last_access) > 0,
                        ends: parseInt(got.expire_epoch) > (new Date).getTime(),
                        trigger: got.trigger
                    };
                }, function(e) {
                    delete self.backend.profile.data[self.data_name].shared_to[val];
                });
            });
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
     * Check if this data is shared.
     * @function shared
     * @public
     * @return {Boolean} shared or not.
     */
    shared(): boolean {
        return Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to).length != 0;
    }

    /**
     * Modifies the data.
     * @function modify
     * @public
     */
    modify() {
        var replacement, from = new Date(this.new_date).getTime(), done = false;
        if(this.is_dated) {
            replacement = JSON.parse(this.decr_data);
            for(var i = 0; i < replacement.length; i++) {
                if(from > replacement[i].from) {
                    replacement.splice(i, 0, {
                        from: from,
                        value:(this.new_data_file != '')? this.new_data_file : this.new_data
                    });
                    done = true;
                    break;
                }
            }
            if(!done) {
                replacement.push({
                    from: from,
                    value:(this.new_data_file != '')? this.new_data_file : this.new_data
                });
            }
            replacement = JSON.stringify(replacement);
        } else {
            replacement = (this.new_data_file != '')? this.new_data_file : this.new_data;
        }
        this.mod(replacement, true);
    }

    /**
     * Modifies a data the way asked.
     * @function mod
     * @public
     * @param {String} replacement New value.
     * @param {Boolean} back Should back.
     */
    mod(replacement: string, back: boolean) {
        var self = this, names = this.sharedIds(), dict: {[id: string]: Date} = {}
        for(var i = 0; i < names.length; i++) {
            dict[names[i]] = this.timings[names[i]].ee;
        }
        this.dataservice.modifyData(this.data_name, replacement, this.is_dated, dict).then(function() {
            self.new_data = '';
            self.decr_data = replacement;
            if(back)
                self.back(false);
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
            self.back(false);
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
        if(!this.backend.profile.data[this.data_name])
            return [];
        return Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to);
    }

    /**
     * Back to profile.
     * @function back
     * @public
     * @param {Boolean} gen To generics page.
     */
    back(gen: boolean) {
        if(gen)
            this.router.navigate(['/generics']);
        else
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
        var self = this, keys = Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to);
        keys.forEach(function(val) {
            this.backend.revokeVault(this.backend.profile.data[this.data_name].shared_to[val]).then(function() {
                delete self.backend.profile.data[self.data_name].shared_to[val];
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
            });
        });
    }

    /**
     * Register a new grant.
     * @function register
     * @public
     */
    register() {
        var self = this;
        this.dataservice.grantVault(this.new_id, this.data_name, this.decr_data, new Date(this.new_date), this.new_trigger).then(function(user, id) {
            self.backend.profile.data[self.data_name].shared_to[user._id] = id;
            self.timings[user._id] = {la: new Date(0), ee: new Date(self.new_date), seen: false,
                ends: new Date(self.new_date).getTime() > (new Date).getTime(), trigger: self.new_trigger};
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
