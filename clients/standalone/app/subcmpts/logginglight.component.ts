/**
 * Component displaying a logging screen lightened.
 * @module logginglight.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: `
        <form class="form-signin">
            <div class="form-group">
                {{ 'login.username' | translate }}<br />
                <input type="text" [(ngModel)]="username" name="n0" class="form-control" required>
            </div>
            <div class="checkbox">
                <label><input type="checkbox" name="n90" [(ngModel)]="use_pwd" checked> {{ 'login.use_pwd' | translate }}</label>
            </div>
            <div class="form-group">
                {{ 'login.password' | translate }}<br />
                <input type="password" [(ngModel)]="password" name="n1" class="form-control" [disabled]="!use_pwd" required>
            </div>
            <div class="form-group">
                {{ 'login.password_file' | translate }}<br />
                <input type="file" (change)="fileLoad($event)" name="n50" class="form-control" [disabled]="use_pwd" required>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label><input type="checkbox" name="n2" [(ngModel)]="persistent"> {{ 'login.remember' | translate }}</label>
                </div>
                <button type="submit" class="btn btn-primary" (click)="enter()">{{ 'login.goOn' | translate }}</button>
            </div>
        </form>
    `
})
export class Logginglight implements OnInit {

    public username: string;
    public password: string;
    public use_pwd: boolean;
    private onEnd: boolean;

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
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService, private dataservice: Data) {
        this.onEnd = true;
        this.use_pwd = true;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     * @param {Boolean} set Set the decryption key.
     */
    ngOnInit(set: boolean): void {
        var self = this;
        if(this.onEnd && /end/.test(window.location.href)) {
            //Session has expired
            this.onEnd = false;
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('key_decryption');
            window.setTimeout(function() {
                self.notif.alert(self.translate.instant('error'), self.translate.instant('sessionExpired'));
            }, 1500);
        }
        if('token' in sessionStorage) {
            this.backend.getProfile().then(function(profile) {
                //Router.go...
                self.backend.profile = profile;
                if(!!set) {
                    sessionStorage.setItem('key_decryption', window.sha256(self.password + profile.salt));
                }
                if(!!localStorage.getItem('return_url') && localStorage.getItem('return_url').length > 1) {
                    var ret = localStorage.getItem('return_url');
                    ret = JSON.parse(ret);
                    localStorage.removeItem('return_url');
                    self.router.navigate(ret);
                } else {
                    localStorage.removeItem('return_url');
                    self.router.navigate(['/profile']);
                }
            }, function(e) {
                sessionStorage.removeItem('token');
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
            self.password = r.result;
        }
        r.readAsText(file);
    }
    
}