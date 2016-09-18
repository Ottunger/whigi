/**
 * Component displaying a reset screen.
 * @module reset.component
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
        <div style="box-shadow: 0 0 10px 10px black; padding: 10px;">
            <form class="form-signin">
                <div class="heading">
                    <h3 class="form-signin-heading">{{ 'reset.reset' | translate }}</h3>
                </div>
                <div class="checkbox">
                    <label><input type="checkbox" name="n90" [(ngModel)]="use_pwd" checked> {{ 'login.use_pwd' | translate }}</label>
                </div>
                <div class="form-group">
                    {{ 'reset.password' | translate }}<br />
                    <input type="password" [(ngModel)]="password" name="n4" class="form-control" [disabled]="!use_pwd" required>
                </div>
                <div class="form-group">
                    {{ 'reset.password' | translate }}<br />
                    <input type="password" [(ngModel)]="password2" name="n5" class="form-control" [disabled]="!use_pwd" required>
                </div>
                <div class="form-group">
                    {{ 'login.password_file' | translate }}<br />
                    <input type="file" (change)="fileLoad($event)" name="n50" class="form-control" [disabled]="use_pwd" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" (click)="enter()">{{ 'reset.send' | translate }}</button>
                </div>
            </form>
        </div>
    `
})
export class Reset implements OnInit, OnDestroy {

    public password: string;
    public password2: string;
    public use_pwd: boolean;
    private id: string;
    private pwd: string;
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
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data) {
        this.use_pwd = true;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.pwd = params['pwd'];
            self.id = params['id'];
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
        if(this.password.length < 8) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
            return;
        }
        if(this.password == this.password2) {
            this.backend.createToken(this.id, this.pwd, false).then(function(token) {
                localStorage.setItem('token', token._id);
                self.backend.getProfile().then(function(user) {
                    self.backend.profile = user;
                    localStorage.setItem('key_decryption', window.sha256(self.pwd + user.salt));
                    localStorage.setItem('psha', window.sha256(self.password));
                    self.dataservice.listData().then(function() {
                        self.backend.updateProfile(self.password, self.pwd).then(function() {
                            self.dataservice.modifyData('keys/pwd/mine1', self.password.slice(0, 4), false, self.backend.profile.data['keys/pwd/mine1'].shared_to).then(function() {
                                self.dataservice.modifyData('keys/pwd/mine2', self.password.slice(4), false, self.backend.profile.data['keys/pwd/mine2'].shared_to).then(function() {
                                    window.location.href = '/';
                                }, function(e) {
                                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                                });
                            }, function(e) {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                            });
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                        });
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
        }
    }

    /**
     * Loads a file as password.
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
                self.password = atob(r.result.split(',')[1]);
            else
                self.password = r.result;
            self.password2 = self.password;
        }
        r.readAsText(file);
    }
    
}
