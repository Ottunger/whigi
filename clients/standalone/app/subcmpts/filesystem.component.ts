/**
 * Component displaying the files as folders.
 * @module filesystem.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, ApplicationRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ dataservice.sanitarize(folders, true) }}</h2>
        <button type="button" class="btn btn-primary" (click)="router.navigate(['/profile'])">{{ 'back' | translate }}</button>
        <br />

        <h3 *ngIf="!!hasKey()">{{ hasKey() | translate }}</h3><br />

        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>{{ 'filesystem.data_name' | translate }}</th>
                        <th>{{ 'filesystem.data' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="info">
                        <td></td>
                        <td>{{ 'filesystem.folder' | translate }}</td>
                        <td><button type="button" class="btn btn-default" (click)="getUp()" [disabled]="folders==''">{{ 'filesystem.getUp' | translate }}</button></td>
                    </tr>
                    <tr *ngFor="let d of folderNames()"  class="info">
                        <td>{{ d }}</td>
                        <td>{{ 'filesystem.folder' | translate }}</td>
                        <td><button type="button" class="btn btn-default" (click)="select(d)">{{ 'filesystem.goTo' | translate }}</button></td>
                    </tr>
                    <tr *ngFor="let d of dataNames()">
                        <td>{{ d }}</td>
                        <td><i>{{ 'filesystem.mix' | translate }}</i></td>
                        <td><button type="button" class="btn btn-default" (click)="view(d)">{{ 'filesystem.goTo' | translate }}</button></td>
                    </tr>
                    <tr *ngIf="mode=='data'" class="info">
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td>{{ 'filesystem.folder' | translate }}</td>
                        <td>
                            <button type="button" class="btn btn-default" (click)="select(data_name); data_name=''" [disabled]="!data_name || data_name==''">{{ 'filesystem.newFolder' | translate }}</button>
                        </td>
                    </tr>

                    <tr *ngIf="mode=='data' && !backend.generics[folders.slice(0, -1)]">
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td><input type="text" [(ngModel)]="data_value" name="s1" class="form-control"></td>
                        <td>
                            <button type="button" class="btn btn-default" (click)="register(false, false)">{{ 'filesystem.record' | translate }}</button>
                        </td>
                    </tr>
                    <tr *ngIf="mode=='data' && !backend.generics[folders.slice(0, -1)]">
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td><input type="file" (change)="fileLoad($event)" name="n50" class="form-control"></td>
                        <td>
                            <button type="button" class="btn btn-default" (click)="register(true, false)" [disabled]="data_value_file==''">{{ 'filesystem.record' | translate }}</button>
                        </td>
                    </tr>

                    <tr *ngIf="mode=='data' && !backend.generics[folders.slice(0, -1)]">
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td><input type="text" [(ngModel)]="data_value" name="s1" class="form-control"></td>
                        <td>
                            <div class='input-group date' id='pick1'>
                                <input type='text' class="form-control" />
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar"></span>
                                </span>
                            </div>
                            <button type="button" class="btn btn-default" (click)="register(false, true)">{{ 'filesystem.record' | translate }}</button>
                        </td>
                    </tr>
                    <tr *ngIf="mode=='data' && !backend.generics[folders.slice(0, -1)]">
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td><input type="file" (change)="fileLoad($event)" name="n50" class="form-control"></td>
                        <td>
                            <div class='input-group date' id='pick2'>
                                <input type='text' class="form-control" />
                                <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar"></span>
                                </span>
                            </div>
                            <button type="button" class="btn btn-default" (click)="register(true, true)" [disabled]="data_value_file==''">{{ 'filesystem.record' | translate }}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
})
export class Filesystem implements OnInit {

    public data_name: string;
    public data_value: string;
    public data_value_file: string;
    private mode: string;
    private folders: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param routed Route snapshot service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private routed: ActivatedRoute,
        private notif: NotificationsService, private dataservice: Data, private check: ApplicationRef) {
        this.folders = '';
        this.data_value_file = '';
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.dataservice.listData();
            if(!!params['folders'])
                self.folders = params['folders'];
            self.mode = params['mode'];
            setTimeout(function() {
                window.$('#pick1').datetimepicker();
                window.$('#pick1').datetimepicker('date', window.moment());
                window.$('#pick2').datetimepicker();
                window.$('#pick2').datetimepicker('date', window.moment());
            }, 100);
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {Boolean} as_file Load from file.
     * @param {Boolean} is_dated Dated or not.
     */
    register(as_file: boolean, is_dated: boolean) {
        var self = this, send;
        if(this.completeName() in this.backend.generics || (this.folders.slice(0, -1) in this.backend.generics && 
            this.backend.generics[this.folders.slice(0, -1)][this.backend.generics[this.folders.slice(0, -1)].length - 1].is_folder)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.generics'));
            return;
        }
        if(is_dated) {
            send = JSON.stringify([{
                value: as_file? this.data_value_file : this.data_value,
                from: window.$('#pick1').datetimepicker('date').toDate().getTime()
            }]);
        } else {
            send = as_file? this.data_value_file : this.data_value;
        }
        this.dataservice.newData(this.completeName(), send, is_dated, 0).then(function() {
            self.data_name = '';
            self.data_value = '';
            self.data_value_file = '';
            self.check.tick();
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
        });
    }

    /**
     * Get a folder up.
     * @function getUp
     * @public
     */
    getUp() {
        this.folders = this.folders.replace(/[^\/]+\/$/, '');
    }

    /**
     * Access a folder.
     * @function select
     * @public
     * @param {String} name Folder name.
     */
    select(name: string) {
        this.folders += name + '/';
    }

    /**
     * Navigate to details panel.
     * @function view
     * @public
     * @param {String} name Name of data.
     */
    view(name: string) {
        if(this.mode == 'data') {
            this.router.navigate(['/data', window.encodeURIComponent(this.folders + name)]);
        } else if(this.mode == 'vault') {
            var mail = this.folders.substr(0, this.folders.indexOf('/'));
            this.router.navigate(['/vault', window.encodeURIComponent(mail), this.backend.shared_with_me_trie.find(this.folders + name).value, {
                route_back: this.folders,
                data_name: name
            }]);
        }
    }

    /**
     * List this level.
     * @function listLevel
     * @public
     * @return {Array} Known fields.
     */
    listLevel(): string[] {
        if(this.mode == 'data') {
            return this.backend.data_trie.suggestions(this.folders, '/').sort();
        } else if(this.mode == 'vault') {
            return this.backend.shared_with_me_trie.suggestions(this.folders, '/').sort();
        }
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @return {Array} Known fields.
     */
    dataNames(): string[] {
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });;
    }

    /**
     * Keys of folder names known.
     * @function folderNames
     * @public
     * @return {Array} Known fields.
     */
    folderNames(): string[] {
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) == '/';
        }).map(function(el: string): string {
            return el.slice(0, -1).replace(/.+\//, '');
        });;
    }

    /**
     * Returns a name based on directory structure.
     * @function completeName
     * @private
     * @return {String} Describing name.
     */
    private completeName(): string {
        return this.folders + this.data_name.replace('/', ':');
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
                self.data_value_file = atob(r.result.split(',')[1]);
            else
                self.data_value_file = r.result;
        }
        r.readAsDataURL(file);
    }

    /**
     * Allows to display a context of the folder.
     * @function hasKey
     * @return {String} A key to describe the folder or undefined.
     */
    hasKey(): string {
        if(!this.folders || this.folders == '') {
            return '/';
        }
        var key = (this.mode == 'data')? this.folders : this.folders.replace(/^[^\/]*\//, '');
        return this.translate.instant(key) == key? undefined : key;
    }
    
}
