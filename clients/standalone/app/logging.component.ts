/**
 * Component displaying a logging screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode, OnInit} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from './app.service';
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
     */
    constructor(private translate: TranslateService, private backend: Backend) {
        translate.addLangs(['en', 'fr']);
        translate.setDefaultLang('en');
        let browserLang = translate.getBrowserLang();
        translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        if('token' in localStorage) {
            //Router.go...
        }
    }

    /**
     * Tries to log in.
     * @function enter
     * @public
     * @param event Click event.
     */
    enter(event) {
        this.backend.getProfile(this.username, this.password).then(function() {
            //Router.go...
            alert("ok");
        }, function(e) {
            //Display...
            console.trace();
        });
    }
    
}
