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
        <button *ngIf="is_generic" type="button" class="btn btn-primary" (click)="back(true)">{{ 'dataview.toGen' | translate }}</button>
        <br />
        <clear-view [decr_data]="decr_data" [is_dated]="is_dated" [data_name]="data_name" [change]="true" [is_folder]="is_generic && !!backend.generics[gen_name][version].json_keys"
            (notify)="mod($event, false)" [gen_name]="gen_name" [is_generic]="is_generic" [version]="version"></clear-view>
        <br /><br />

        <p *ngIf="!is_dated">{{ 'modify' | translate }}</p>
        <p *ngIf="!!is_dated && is_dated">{{ 'add' | translate }}</p>
        <div *ngIf="!!is_dated && is_dated" class='input-group date' id='pick4'>
            <input type='text' class="form-control"/>
            <span class="input-group-addon">
                <span class="glyphicon glyphicon-calendar"></span>
            </span>
        </div>

        <div *ngIf="!is_generic">
            <input type="text" [(ngModel)]="new_data" [disabled]="new_data_file!=''" class="form-control">
            <input type="file" (change)="fileLoad($event)" class="form-control">
        </div>
        <div *ngIf="is_generic">
            <input type="text" *ngIf="!backend.generics[gen_name][version].is_file && !backend.generics[gen_name][version].json_keys" [(ngModel)]="new_data" name="s1" class="form-control">
            <div *ngIf="!backend.generics[gen_name][version].is_file && !!backend.generics[gen_name][version].json_keys">
                <div class="form-group" *ngFor="let k of backend.generics[gen_name][version].json_keys">
                    {{ k | translate }}<br />
                    <input type="text" [(ngModel)]="new_datas[k]" name="s1" class="form-control">
                </div>
            </div>
            <input type="file" *ngIf="backend.generics[gen_name][version].is_file" (change)="fileLoad($event)" name="n50" class="form-control">
        </div>


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
                        <th *ngIf="is_generic && data_name != gen_name">{{ 'dataview.redirect' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let d of sharedIds()">
                        <td><a (click)="user(d)">{{ d }}</a></td>
                        <td *ngIf="!!timings[d] && timings[d].seen">
                            <div class='input-group date' id='pick-id{{ d }}'>
                                <input type='text' class="form-control" readonly="readonly"/>
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar"></span>
                                </span>
                            </div>
                        </td>
                        <td *ngIf="!!timings[d] && timings[d].ends">
                            <div class='input-group date' id='pick-id2{{ d }}'>
                                <input type='text' class="form-control" readonly="readonly"/>
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar"></span>
                                </span>
                            </div>
                        </td>
                        <td *ngIf="!!timings[d] && !timings[d].seen">{{ 'dataview.neverSeen' | translate }}</td>
                        <td *ngIf="!!timings[d] && !timings[d].ends">{{ 'dataview.forever' | translate }}</td>
                        <td *ngIf="!timings[d]"></td>
                        <td *ngIf="!timings[d]"></td>
                        <td *ngIf="!!timings[d]">{{ timings[d].trigger }}</td>
                        <td *ngIf="!timings[d]"></td>

                        <td *ngIf="is_generic && data_name != gen_name">
                            <select class="form-control" [(ngModel)]="filter">
                                <option *ngFor="let f of filters()" [value]="f">{{ f | translate }}</option>
                            </select>
                        </td>

                        <td>
                            <button type="button" class="btn btn-primary" (click)="change(d)" [disabled]="filter==''">{{ 'redirect' | translate }}</button>
                            <button type="button" class="btn btn-default" (click)="revoke(d)">{{ 'remove' | translate }}</button>
                        </td>
                    </tr>
                    <tr>
                        <td><input type="text" [(ngModel)]="new_id" name="y0" class="form-control"></td>
                        <td></td>
                        <td>
                            <div class='input-group date' id='pick5'>
                                <input type='text' class="form-control"/>
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar"></span>
                                </span>
                            </div>
                        </td>
                        <td><input type="text" [(ngModel)]="new_trigger" name="y1" class="form-control"></td>
                        <td *ngIf="is_generic && data_name != gen_name"></td>
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
    public new_datas: {[id: string]: string};
    public new_data: string;
    public new_data_file: string;
    public new_id: string;
    public timings: {[id: string]: {la: Date, ee: Date, seen: boolean, ends: boolean, trigger: string}};
    public is_dated: boolean;
    public new_trigger: string;
    public is_generic: boolean;
    public version: number;
    public gen_name: string;
    public filter: string;
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
        this.is_generic = false;
        this.timings = {};
        this.new_datas = {};
        this.filter = '';
        this.version = 0;
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
                self.version = data.version;
                self.data = data;
                if(!!self.backend.generics[self.data_name]) {
                    self.is_generic = true;
                    self.gen_name = self.data_name;
                } else if(!!self.backend.generics[self.data_name.replace(/\/[^\/]*$/, '')] && self.backend.generics[self.data_name.replace(/\/[^\/]*$/, '')][self.version].is_folder) {
                    self.is_generic = true;
                    self.gen_name = self.data_name.replace(/\/[^\/]*$/, '');
                }
                self.data.encr_data = self.backend.str2arr(self.data.encr_data);
                self.backend.decryptAES(self.data.encr_data, self.dataservice.workerMgt(false, function(got) {
                    self.decr_data = got;
                    self.check.tick();
                }));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
            });
            window.$('#pick4').datetimepicker();
            window.$('#pick4').datetimepicker('date', window.moment());
            window.$('#pick5').datetimepicker();
            window.$('#pick5').datetimepicker('date', window.moment());
            window.$('#pick5').datetimepicker('options', {widgetPositioning: {vertical: 'bottom'}});
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
     * Returns other possible values.
     * @function filters
     * @public
     * @return {String[]} Values.
     */
    filters(): string[] {
        var self = this;
        return this.backend.data_trie.suggestions(this.gen_name + '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/' && el != self.data_name;
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Modifies the data.
     * @function modify
     * @public
     */
    modify() {
        var replacement, from = window.$('#pick4').datetimepicker('date').toDate(), done = false;
        if(this.is_generic && !!this.backend.generics[this.gen_name][this.version].json_keys) {
            var ret = {};
            for(var i = 0; i < this.backend.generics[this.gen_name][this.version].json_keys.length; i++) {
                ret[this.backend.generics[this.gen_name][this.version].json_keys[i]] = this.new_datas[this.backend.generics[this.gen_name][this.version].json_keys[i]];
            }
            this.new_data = JSON.stringify(ret);
        }
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
        this.dataservice.modifyData(this.data_name, replacement, this.is_dated, dict, (this.is_generic && this.data_name != this.gen_name)).then(function() {
            self.new_datas = {};
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
        var self = this;
        if(!this.backend.profile.data[this.data_name])
            return [];
        var ret = Object.getOwnPropertyNames(this.backend.profile.data[this.data_name].shared_to);
        ret.forEach(function(d) {
            if(!!self.timings[d]) {
                window.$('#pick-id' + d).datetimepicker();
                window.$('#pick-id' + d).datetimepicker('date', window.moment(self.timings[d].la.getTime()));
                window.$('#pick-id2' + d).datetimepicker();
                window.$('#pick-id2' + d).datetimepicker('date', window.moment(self.timings[d].ee.getTime()));
            }
        })
        return ret;
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
     * Transfers an access.
     * @function change
     * @public
     * @param {String} shared_to_id Id of sharee.
     */
    change(shared_to_id: string) {
        var self = this;
        this.backend.getAccessVault(this.backend.profile.data[this.data_name].shared_to[shared_to_id]).then(function(timer) {
            self.backend.revokeVault(self.backend.profile.data[self.data_name].shared_to[shared_to_id]).then(function() {
                //Remove actual vault
                delete self.backend.profile.data[self.data_name].shared_to[shared_to_id];
                //Get other data and create its vault
                self.backend.getData(self.backend.profile.data[self.gen_name + '/' + self.filter].id).then(function(data) {
                    self.backend.decryptAES(data.encr_data, self.dataservice.workerMgt(false, function(got) {
                        self.dataservice.grantVault(shared_to_id, self.gen_name, self.gen_name + '/' + self.filter, got, self.version, new Date(timer.expire_epoch), timer.trigger).then(function() {
                            self.backend.triggerVaults(self.gen_name + '/' + self.filter);
                            self.notif.success(self.translate.instant('success'), self.translate.instant('dataview.transfered'));
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noGrant'));
                        });
                    }));
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
            });
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
        var date: Date = window.$('#pick5').datetimepicker('date').toDate();
        this.dataservice.grantVault(this.new_id, this.data_name, this.data_name, this.decr_data, this.version, date, this.new_trigger).then(function(user, id) {
            self.backend.profile.data[self.data_name].shared_to[user._id] = id;
            self.timings[user._id] = {la: new Date(0), ee: date, seen: false,
                ends: date.getTime() > (new Date).getTime(), trigger: self.new_trigger};
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
            if(/^data:;base64,/.test(r.result))
                self.new_data_file = atob(r.result.split(',')[1]);
            else
                self.new_data_file = r.result;
        }
        r.readAsDataURL(file);
    }

    /**
     * Go to user page
     * @function user
     * @param {String} user The user.
     */
    user(user: string) {
        this.router.navigate(['/user', user, JSON.stringify(this.router.routerState.snapshot.url.split('/').map(window.decodeURIComponent))]);
    }
    
}
