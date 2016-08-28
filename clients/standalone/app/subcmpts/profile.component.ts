/**
 * Component displaying the welcome screen.
 * @module profile.component
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
        <h2>{{ backend.profile.username }}</h2>
        <button type="button" class="btn btn-primary" (click)="logout()">{{ 'profile.logout' | translate }}</button>
        <br />

        <div class="table-responsive">
            <table class="table table-condensed table-bordered">
                <thead>
                    <tr>
                        <th>{{ 'profile.data_name' | translate }}</th>
                        <th>{{ 'profile.data' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td></td>
                        <td>{{ 'profile.folder' | translate }}</td>
                        <td><button type="button" class="btn btn-default" (click)="getUp()" [disabled]="folders==''">{{ 'profile.getUp' | translate }}</button></td>
                    </tr>
                    <tr *ngFor="let d of folderNames()">
                        <td>{{ d }}</td>
                        <td>{{ 'profile.folder' | translate }}</td>
                        <td><button type="button" class="btn btn-default" (click)="select(d)">{{ 'profile.goTo' | translate }}</button></td>
                    </tr>
                    <tr *ngFor="let d of dataNames()">
                        <td>{{ d }}</td>
                        <td><i>{{ 'profile.mix' | translate }}</i></td>
                        <td><button type="button" class="btn btn-default" (click)="view(d)">{{ 'profile.goTo' | translate }}</button></td>
                    </tr>
                    <tr>
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td>{{ 'profile.folder' | translate }}</td>
                        <td><button type="button" class="btn btn-default" (click)="select(data_name); data_name=''">{{ 'record' | translate }}</button></td>
                    </tr>
                    <tr>
                        <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                        <td><input type="text" [(ngModel)]="data_value" name="s1" class="form-control"></td>
                        <td><button type="button" class="btn btn-default" (click)="register()">{{ 'record' | translate }}</button></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p>{{ 'profile.lookUp' | translate }}</p>
        <input type="text" [(ngModel)]="vault_name" name="u0" class="form-control">
        <input type="text" [(ngModel)]="vault_email" name="u1" class="form-control">
        <button type="button" class="btn btn-default" (click)="seeVault()" [disabled]="!backend.profile.shared_with_me">{{ 'profile.goTo' | translate }}</button>
    `
})
export class Profile implements OnInit {

    public data_name: string;
    public data_value: string;
    public vault_name: string;
    public vault_email: string;
    private folders: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private routed: ActivatedRoute,
        private notif: NotificationsService, private dataservice: Data, private check: ApplicationRef) {
        this.folders = '';
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
        });
    }

    /**
     * Log out.
     * @function logout
     * @public
     */
    logout() {
        var self = this;
        this.backend.removeTokens().then(function() {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('key_decryption');
            self.router.navigate(['/']);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     */
    register() {
        var self = this;
        this.dataservice.newData(this.completeName(), this.data_value).then(function() {
            self.data_name = '';
            self.data_value = '';
            self.check.tick();
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.exists'));
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
     * @return {String} name Name of data.
     */
    view(name: string) {
        this.router.navigate(['/data', window.encodeURIComponent(this.folders + name)]);
    }

    /**
     * List this level.
     * @function listLevel
     * @public
     * @return {Array} Known fields.
     */
    listLevel(): string[] {
        return this.backend.data_trie.suggestions(this.folders, '/');
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @return {Array} Known fields.
     */
    dataNames(): string[] {
        var self = this;
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
        var self = this;
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) == '/';
        }).map(function(el: string): string {
            return el.slice(0, -1).replace(/.+\//, '');
        });;
    }

    /**
     * Navigate to vault panel.
     * @function seeVault
     * @public
     */
    seeVault() {
        var self = this;
        this.backend.getUser(this.vault_email).then(function(user) {
            if(!!this.backend.profile.shared_with_me[user._id] && !!this.backend.profile.shared_with_me[user._id][self.vault_name]) {
                self.backend.profile.sharer = user;
                self.router.navigate(['/vault', window.encodeURIComponent(self.vault_email), self.backend.profile.shared_with_me[user._id][self.vault_name]]);
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('vaultview.noData'));
            }
        }, function() {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noUser'));
        });
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
    
}
