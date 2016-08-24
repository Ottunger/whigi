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
import {NotificationsService} from 'notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ data_name }}</h2>
        <button type="button" class="btn btn-primary" (click)="back()">{{ 'back' | translate }}</button>
        <br />
        <p>{{ 'dataview.actual' | translate }}</p>
        <input type="text" [(ngModel)]="decr_data" class="form-control" readonly>
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
                        <td>{{ shared_profiles[d].email }}</td>
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
export class Dataview implements OnInit {

    public data: any;
    public link: any;
    public data_name: string;
    public decr_data: string;
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
        private notif: NotificationsService, private routed: ActivatedRoute) {
        
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
            self.data_name = params['name'];
            self.link = self.backend.profile.data[params['name']];
            self.shared_profiles = {};

            self.sharedIds().forEach(function(id) {
                self.backend.getUser(id).then(function(data) {
                    self.shared_profiles[data.id] = data;
                });
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
     * Keys of shared people.
     * @function sharedIds
     * @public
     * @return {Array} Known fields.
     */
    sharedIds(): string[] {
        var keys = [];
        for (var key in this.link.shared_to) {
            if (this.link.shared_to.hasOwnProperty(key)) {
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
        this.backend.getUser(this.new_email).then(function(user) {
            var aesKey: number[] = self.backend.newAES();
            if(!self.decr_data)
                self.decr_data = self.backend.decryptAES(self.data.encr_data);
            var data_crypted_aes: number[] = self.backend.encryptAES(self.decr_data, aesKey);
            var aes_crypted_shared_pub: string = self.backend.encryptRSA(aesKey, user.rsa_pub_key);

            self.backend.createVault(self.data_name, user._id, data_crypted_aes, aes_crypted_shared_pub).then(function(res) {
                self.link.shared_to[user._id] = res._id;
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noGrant'));
            });
        }, function(e) {
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
    
}
