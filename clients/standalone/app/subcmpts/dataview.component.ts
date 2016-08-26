/**
 * Component displaying a detailed view of a data.
 * @module dataview.component
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
        <h2>{{ sanitarize(data_name) }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />
        <p>{{ 'actual' | translate }}</p>
        <input type="text" [(ngModel)]="decr_data" class="form-control" readonly>
        <br />
        <p>{{ 'modify' | translate }}</p>
        <input type="text" [(ngModel)]="new_data" class="form-control">
        <button type="button" class="btn btn-primary" (click)="modify()">{{ 'record' | translate }}</button>
        <br />

        <div class="table-responsive">
            <table class="table table-condensed table-bordered">
                <thead>
                    <tr>
                        <th>{{ 'dataview.shared_to' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let d of sharedIds()">
                        <td>{{ emailOf(d) }}</td>
                        <td><button type="button" class="btn btn-default" (click)="revoke(d)">{{ 'remove' | translate }}</button></td>
                    </tr>
                    <tr>
                        <td><input type="text" [(ngModel)]="new_email" name="y0" class="form-control"></td>
                        <td><button type="button" class="btn btn-default" (click)="register()">{{ 'record' | translate }}</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
})
export class Dataview implements OnInit, OnDestroy {

    public data: any;
    public link: any;
    public data_name: string;
    public decr_data: string;
    public new_data: string;
    public shared_profiles: any;
    public new_email: string;
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
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data) {

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
            self.link = self.backend.profile.data[self.data_name];
            self.dataservice.populateUsers(self.sharedIds()).then(function(dict) {
                self.shared_profiles = dict;
            });

            self.backend.getData(self.link.id).then(function(data) {
                self.data = data;
                self.decr_data = (self.link.length < 100)? self.backend.decryptAES(self.data.encr_data) : self.translate.instant('dataview.long');
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
        var self = this, names = this.sharedIds();

        for(var i = 0; i < names.length; i++) {
            this.link.shared_to[names[i]] = this.shared_profiles[names[i]].email;
        }
        this.dataservice.modifyData(this.data_name, this.new_data, this.link.shared_to).then(function() {
            //Already populated
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.exists'));
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
        for(var key in this.link.shared_to) {
            if(this.link.shared_to.hasOwnProperty(key)) {
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
        this.router.navigate(['/profile']);
    }

    /**
     * Revoke an access.
     * @function revoke
     * @public
     * @param {String} shared_to_id Id of sharee.
     */
    revoke(shared_to_id: string) {
        var self = this;
        this.backend.revokeVault(this.data_name, shared_to_id).then(function() {
            delete self.link[shared_to_id];
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noRevoke'));
        });
    }

    /**
     * Register a new grant.
     * @function register
     * @public
     */
    register() {
        var self = this;
        if(!this.decr_data)
            this.decr_data = this.backend.decryptAES(this.data.encr_data);
        this.dataservice.grantVault(this.new_email, this.data_name, this.data.encr_data).then(function(user, id) {
            self.shared_profiles[user._id] = user;
            self.link.shared_to[user._id] = id;
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
     * Return the email from an id as we know it.
     * @function emailOf
     * @public
     * @param {String} id Id.
     * @return {String} Email.
     */
    emailOf(id: string): string {
        if(!!this.shared_profiles[id])
            return this.shared_profiles[id].email;
        return this.translate.instant('unknown');
    }

    /**
     * Return the structure directory of the data.
     * @function sanitarize
     * @public
     * @param {String} name Name of data.
     * @return {String} Displayable string.
     */
    sanitarize(name: string): string {
        var parts: string[] = name.split(';');
        parts.unshift('/');
        var last = parts.pop();
        return parts.join(' > ') + ' >> ' + last;
    }
    
}
