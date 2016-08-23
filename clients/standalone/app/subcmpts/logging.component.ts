/**
 * Component displaying a logging screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <form class="form-signin">
            <div class="heading">
                <h3 class="form-signin-heading">{{ 'login.title' | translate }}</h3>
            </div>
            <div class="form-group">
                <input type="text" [(ngModel)]="username" name="first" class="form-control" required>
            </div>
            <div class="form-group">
                <input type="password" [(ngModel)]="password" name="second" class="form-control" required>
            </div>
            <div class="form-group">
                <div class="checkbox">
                    <label><input type="checkbox" name="third" [(ngModel)]="persistent"> {{ 'login.remember' | translate }}</label>
                </div>
                <button type="submit" class="btn btn-primary" (click)="enter()">{{ 'login.goOn' | translate }}</button>
            </div>
        </form>
    `
})
export class Logging implements OnInit {

    public username: string;
    public password: string;
    public persistent: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router) {
        this.persistent = false;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        if('token' in sessionStorage) {
            this.backend.getProfile().then(function(profile) {
                //Router.go...
                self.backend.profile = profile;
                self.router.navigate(['profile']);
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
            self.ngOnInit();
        }, function(e) {
            console.log("Cannot log in.");
        });
    }
    
}
