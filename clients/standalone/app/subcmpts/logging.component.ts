/**
 * Component displaying a logging screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'notifications';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'login.title' | translate }}</h3>
            </div>
            <div class="form-group">
                {{ 'login.username' | translate }}<br />
                <input type="text" [(ngModel)]="username" name="n0" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'login.password' | translate }}<br />
                <input type="password" [(ngModel)]="password" name="n1" class="form-control" required>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label><input type="checkbox" name="n2" [(ngModel)]="persistent"> {{ 'login.remember' | translate }}</label>
                </div>
                <button type="submit" class="btn btn-primary" (click)="enter()">{{ 'login.goOn' | translate }}</button>
            </div>
        </form>
        <br />
        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'login.forgot' | translate }}</h3>
            </div>
            <div class="form-group">
                {{ 'login.email' | translate }}<br />
                <input type="text" [(ngModel)]="email" name="n10" class="form-control" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary" (click)="forgot()">{{ 'login.sendForgot' | translate }}</button>
            </div>
        </form>
        <br />
        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'login.register' | translate }}</h3>
            </div>
            <div class="form-group">
                {{ 'login.username' | translate }}<br />
                <input type="text" [(ngModel)]="username" name="n3" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'login.password' | translate }}<br />
                <input type="password" [(ngModel)]="password" name="n4" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'login.password' | translate }}<br />
                <input type="password" [(ngModel)]="password2" name="n5" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'login.email' | translate }}<br />
                <input type="text" [(ngModel)]="email" name="n6" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'login.first_name' | translate }}<br />
                <input type="text" [(ngModel)]="first_name" name="n7" class="form-control" required>
            </div>
            <div class="form-group">
                {{ 'login.last_name' | translate }}<br />
                <input type="text" [(ngModel)]="last_name" name="n8" class="form-control" required>
            </div>
            <div class="form-group">
                <div id="grecaptcha"></div>
                <button type="submit" class="btn btn-primary" (click)="signUp()">{{ 'login.send' | translate }}</button>
            </div>
        </form>
    `
})
export class Logging implements OnInit {

    public username: string;
    public password: string;
    public password2: string;
    public email: string;
    public first_name: string;
    public last_name: string;
    public persistent: boolean;
    private createCaptcha: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService) {
        this.persistent = false;
        this.createCaptcha = true;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     * @param {Boolean} set Set the decryption key.
     */
    ngOnInit(set: boolean): void {
        var self = this;
        if('token' in sessionStorage) {
            this.backend.getProfile().then(function(profile) {
                //Router.go...
                self.backend.profile = profile;
                if(set) {
                    sessionStorage.setItem('key_decryption', window.sha256(self.password + profile.salt));
                }
                self.router.navigate(['/profile']);
            }, function(e) {
                sessionStorage.removeItem('token');
            });
        }
        if(this.createCaptcha) {
            this.createCaptcha = false;
            window.grecaptcha.render('grecaptcha', {
                sitekey: '6LfleigTAAAAALOtJgNBGWu4A0ZiHRvetRorXkDx'
            });
        }
    }

    /**
     * Tries to log in.
     * @function enter
     * @public
     */
    enter() {
        var self = this;
        this.backend.createToken(this.username, this.password, this.persistent).then(function(ticket) {
            sessionStorage.setItem('token', ticket._id);
            self.ngOnInit(true);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noLogin'));
        });
    }

    /**
     * Tries to sign up.
     * @function signUp
     * @public
     */
    signUp() {
        var self = this;
        if(this.password == this.password2 && /^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(this.email)) {
            this.backend.createUser(this.first_name, this.last_name, this.username, this.password, this.email).then(function() {
                self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
            });
        } else {
            self.notif.alert(self.translate.instant('error'), self.translate.instant('login.noMatch'));
        }
    }

    /**
     * Tries to have a reset link.
     * @function forgot
     * @public
     */
    forgot() {
        var self = this;
        if(/^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(this.email)) {
            this.backend.requestRestore(this.email).then(function() {
                self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noReset'));
            });
        }
    }
    
}
