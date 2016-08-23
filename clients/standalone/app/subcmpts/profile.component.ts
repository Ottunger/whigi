/**
 * Component displaying the welcome screen.
 * @module profile.component
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
        <h2>{{ backend.profile.username }}</h2>
        <button type="button" class="btn btn-primary" (click)="logout()">{{ 'profile.logout' | translate }}</button>
    `
})
export class Profile implements OnInit {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router) {
        
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        if(!this.backend.profile)
            this.router.navigate(['']);
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
            self.router.navigate(['']);
        }, function(e) {
            console.log("Cannot log out.");
        });
    }
    
}
