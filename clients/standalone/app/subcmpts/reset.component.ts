/**
 * Component displaying a logging screen.
 * @module logging.component
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
enableProdMode();

@Component({
    template: `
        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'reset.reset' | translate }}</h3>
            </div>
            <div class="form-group" *ngIf="use_recup">
                {{ 'reset.received' | translate }}{{ recup_mail }}<br />
                <input type="text" [(ngModel)]="first_half" name="n0" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'reset.password' | translate }}<br />
                <input type="password" [(ngModel)]="password" name="n4" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'reset.password' | translate }}<br />
                <input type="password" [(ngModel)]="password2" name="n5" class="form-control" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary" (click)="enter()">{{ 'reset.send' | translate }}</button>
            </div>
        </form>
    `
})
export class Reset implements OnInit, OnDestroy {

    public password: string;
    public password2: string;
    public first_half: string;
    public use_recup: boolean;
    private key: string;
    private recup_mail: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
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
            self.key = params['key'];
            self.recup_mail = window.decodeURIComponent(params['recup_mail']);
            self.use_recup = !!self.recup_mail && self.recup_mail.indexOf('@') > -1;
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
     * Tries to reset password.
     * @function enter
     * @public
     */
    enter() {
        var self = this;
        if(this.use_recup && (!this.first_half || this.first_half.length < 2)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
            return;
        }
        if(this.password == this.password2) {
            this.backend.getRestore(this.key).then(function(data) {
                sessionStorage.setItem('token', data.token);
                self.backend.getProfile().then(function(user) {
                    var encr_master_key;
                    if(self.use_recup)
                        self.backend.encryptMasterAES(self.password, user.salt, self.first_half + data.master_key);
                    else
                        self.backend.encryptMasterAES(self.password, user.salt, data.master_key)
                    self.backend.updateProfile(self.password, encr_master_key).then(function() {
                        self.router.navigate(['']);
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
            });
        } else {
            self.notif.alert(self.translate.instant('error'), self.translate.instant('reset.noMatch'));
        }
    }
    
}
