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
        <div style="box-shadow: 0 0 10px 10px black; padding: 10px;">
            <h2>{{ 'account.question' | translate }}</h2>
            <br />
            <p>{{ 'account.explain' | translate }}</p>
            <br />
            <p>{{ 'account.id_to' | translate }}{{ id_to }}</p>
            <br />
            <p *ngIf="with_account != 'false'">{{ 'account.withAccount' | translate }}</p>
            <br />
            <div *ngIf="!forever">
                {{ 'account.until' | translate }}
                <div class='input-group date' id='pick3'>
                    <input type='text' class="form-control" readonly="readonly" />
                    <span class="input-group-addon">
                        <span class="glyphicon glyphicon-calendar"></span>
                    </span>
                </div>
            </div>
            <p *ngIf="forever">{{ 'account.forever' | translate }}</p>
            <br />

            <div *ngFor="let p of data_list">
                <h3>
                    {{ 'account.prefix' | translate }}{{ p }}
                    <img *ngIf="!!backend.generics[p] && !!backend.generics[p][backend.generics[p].length - 1].img_url" class="featurette-image img-circle img-responsive pull-right" src="{{ backend.generics[p][backend.generics[p].length - 1].img_url }}">
                    <img *ngIf="!backend.generics[p] || !backend.generics[p][backend.generics[p].length - 1].img_url" class="featurette-image img-circle img-responsive pull-right" src="favicon.png">
                </h3>
                
                <p *ngIf="!backend.generics[p]"><i>{{ 'account.notShared' | translate }}</i></p>
                <div *ngIf="!!backend.generics[p] && !backend.generics[p][backend.generics[p].length - 1].is_folder">
                    <p *ngIf="!!backend.profile.data[p]">{{ 'account.shared' | translate }}</p>
                    <input *ngIf="!backend.profile.data[p] && !backend.generics[p][backend.generics[p].length - 1].is_file" type="text" [(ngModel)]="new_data[p]" class="form-control">
                    <input *ngIf="!backend.profile.data[p] && backend.generics[p][backend.generics[p].length - 1].is_file" type="file" (change)="fileLoad($event, p)" class="form-control">
                </div>
                <div *ngIf="!!backend.generics[p] && backend.generics[p][backend.generics[p].length - 1].is_folder">
                    <select class="form-control" [(ngModel)]="filter[p]">
                        <option *ngFor="let f of filters(p)" [value]="f"><span *ngIf="f != '/new'">{{ f }}</span><span *ngIf="f == '/new'">{{ 'account.new' | translate }}</span></option>
                    </select>
                    <div *ngIf="filter[p] == '/new'">
                        {{ 'account.nameField' | translate }}
                        <input type="text" [(ngModel)]="new_name[p]" name="s18" class="form-control">
                        {{ 'account.dataField' | translate }}
                        <input type="text" *ngIf="!backend.generics[p][backend.generics[p].length - 1].is_file && !backend.generics[p][backend.generics[p].length - 1].json_keys" [(ngModel)]="new_data[p]" name="s1" class="form-control">
                        <div *ngIf="!backend.generics[p][backend.generics[p].length - 1].is_file && !!backend.generics[p][backend.generics[p].length - 1].json_keys">
                            <div class="form-group" *ngFor="let k of backend.generics[p][backend.generics[p].length - 1].json_keys">
                                {{ k | translate }}<br />
                                <input type="text" [(ngModel)]="new_datas[p][k]" name="s1" class="form-control">
                            </div>
                        </div>
                        <input type="file" *ngIf="backend.generics[p][backend.generics[p].length - 1].is_file" (change)="fileLoad($event, p)" name="n50" class="form-control">
                    </div>
                </div>
            </div>
            <br />

            <button type="button" class="btn btn-warning" (click)="finish(true)" [disabled]="!ready">{{ 'account.ok' | translate }}</button>
            <button type="button" class="btn btn-primary" (click)="finish(false)" [disabled]="!ready">{{ 'account.nok' | translate }}</button>
            <br /><br />

            <user-info [user]="requester"></user-info>
        </div>
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
    public new_datas: {[id: string]: {[id: string]: string}};
    public filter: {[id: string]: string};
    public new_name: {[id: string]: string};
    public forever: boolean;
    public trigger: string;
    public with_account: string;
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
        this.new_datas = {};
        this.new_name = {};
        this.filter = {};
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
            self.with_account = params['with_account'];
            self.trigger = (!!params['trigger'])? window.decodeURIComponent(params['trigger']) : '';
            self.expire_epoch = (!!params['expire_epoch'])? new Date(parseInt(params['expire_epoch'])) : new Date(0);
            self.forever = parseInt(params['expire_epoch']) < (new Date).getTime();

            window.$('#pick3').datetimepicker();
            window.$('#pick3').datetimepicker('date', window.moment(parseInt(params['expire_epoch'])));
            
            //We prepare HTTPS
            if(!/^http/.test(self.return_url_ok)) {
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
                    if((!(self.data_list[i] in self.backend.profile.data) || !(self.id_to in self.backend.profile.data[self.data_list[i]].shared_to)) && self.data_list[i] in self.backend.generics) {
                        var ret = self.backend.data_trie.suggestions(self.data_list[i] + '/', '/').sort().filter(function(el: string): boolean {
                            return el.charAt(el.length - 1) != '/';
                        });
                        var nice = false;
                        for(var j = 0; j < ret.length; j++) {
                            if(ret[j] in self.backend.profile.data && self.id_to in self.backend.profile.data[ret[j]].shared_to) {
                                nice = true;
                                break;
                            }
                        }
                        if(!nice) {
                            all = false;
                            break;
                        }
                    }
                }
                if(all && (self.with_account == 'false' || ('keys/auth/' + self.id_to in self.backend.profile.data &&
                    self.id_to in self.backend.profile.data['keys/auth/' + self.id_to].shared_to))) {
                    if(self.with_account == 'flow') {
                        var arr = self.return_url_ok.split('/');
                        arr.shift();
                        arr.shift();
                        arr.shift();
                        self.router.navigate(arr);
                    } else {
                        window.location.href = self.return_url_ok;
                    }
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
        var self = this, saves: any[] = [];
        if(ok) {
            if(this.with_account != 'false') {
                var key = this.backend.generateRandomString(64);
                saves.push({
                    mode: 'new',
                    data: key,
                    name: 'keys/auth/' + this.id_to,
                    is_dated: false,
                    force: true,
                    version : 0
                });
                saves.push({
                    mode: 'grant',
                    data: key,
                    to: this.id_to,
                    name: 'keys/auth/' + this.id_to,
                    real_name: 'keys/auth/' + this.id_to,
                    until: new Date(0),
                    version: 0
                });
            }
            for(var i = 0; i < this.data_list.length; i++) {
                var adata = this.data_list[i];
                if(adata in this.backend.generics && ((!(adata in this.filter) && !(adata in this.backend.profile.data)) || (adata in this.filter && this.filter[adata] == '/new'))) {
                    if(!!this.backend.generics[adata][this.backend.generics[adata].length - 1].json_keys) {
                        var ret = {};
                        for(var i = 0; i < this.backend.generics[adata][this.backend.generics[adata].length - 1].json_keys.length; i++) {
                            ret[this.backend.generics[adata][this.backend.generics[adata].length - 1].json_keys[i]] = this.new_datas[adata][this.backend.generics[adata][this.backend.generics[adata].length - 1].json_keys[i]];
                        }
                        this.new_data[adata] = JSON.stringify(ret);
                    }
                    if(this.backend.generics[adata][this.backend.generics[adata].length - 1].is_dated) {
                        this.new_data[adata] = JSON.stringify([{
                            value: this.new_data[adata],
                            from: 0
                        }]);
                    }
                    var name = adata;
                    if(this.backend.generics[adata][this.backend.generics[adata].length - 1].is_folder) {
                        name += '/' + this.new_name[adata];
                    }
                    saves.push({
                        mode: 'new',
                        data: this.new_data[adata],
                        name: name,
                        is_dated: this.backend.generics[adata][this.backend.generics[adata].length - 1].is_dated,
                        version: this.backend.generics[adata].length - 1,
                        force: false
                    });
                    saves.push({
                        mode: 'grant',
                        data: this.new_data[adata],
                        to: this.id_to,
                        name: adata,
                        real_name: name,
                        until: this.expire_epoch,
                        version: this.backend.generics[adata].length - 1,
                        trigger: this.trigger
                    });
                } else if(adata in this.backend.generics) {
                    var name = adata;
                    if(this.backend.generics[adata][this.backend.generics[adata].length - 1].is_folder) {
                        name += '/' + this.filter[adata];
                    }
                    saves.push({
                        mode: 'get-and-grant',
                        to: this.id_to,
                        name: adata,
                        real_name: name,
                        until: this.expire_epoch,
                        trigger: this.trigger
                    });
                }
            }
            this.process(saves).then(function() {
                if(self.with_account == 'flow') {
                    var arr = self.return_url_ok.split('/');
                    arr.shift();
                    arr.shift();
                    arr.shift();
                    self.router.navigate(arr);
                } else {
                    window.location.href = self.return_url_ok;
                }
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
     * Deals with grantings, etc.
     * @function process
     * @private
     * @param {Object[]} array Tasks.
     * @return {Promise} When done.
     */
    private process(array: any[]): Promise {
        var self = this, index = 0;
        return new Promise(function(resolve, reject) {
            function next() {
                if(index < array.length) {
                    var work = array[index];
                    index++;
                    switch(work.mode) {
                        case 'new':
                            self.dataservice.newData(work.name, work.data, work.is_dated, work.version, work.force).then(function() {
                                next();
                            }, function(e) {
                                reject(e);
                            });
                            break;
                        case 'grant':
                            self.dataservice.grantVault(work.to, work.name, work.real_name, work.data, work.version, work.until, work.trigger).then(function() {
                                next();
                            }, function(e) {
                                reject(e);
                            });
                            break;
                        case 'get-and-grant':
                            self.backend.getData(self.backend.profile.data[work.real_name].id).then(function(data) {
                                self.backend.decryptAES(self.backend.str2arr(data.encr_data), self.dataservice.workerMgt(false, function(got) {
                                    array.push({
                                        mode: 'grant',
                                        data: got,
                                        to: work.to,
                                        name: work.name,
                                        real_name: work.real_name,
                                        until: work.until,
                                        trigger: work.trigger,
                                        version: data.version
                                    });
                                    next();
                                }));
                            }, function(e) {
                                reject(e);
                            });
                            break;
                        default:
                            break;
                    }
                } else {
                    resolve();
                }
            }
            next();
        });
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
            if(/^data:;base64,/.test(r.result))
                self.new_data[name] = atob(r.result.split(',')[1]);
            else
                self.new_data[name] = r.result;
        }
        r.readAsDataURL(file);
    }

    /**
     * Keys of data names known.
     * @function filters
     * @public
     * @param {String} folder to list.
     * @return {Array} Known fields.
     */
    filters(folder: string): string[] {
        var ret = this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        }).concat(['/new']);

        if(!this.new_datas[folder] && !this.filter[folder]) {
            this.new_datas[folder] = {};
            this.filter[folder] = ret[0];
        }
        return ret;
    }

}
