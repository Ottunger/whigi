/**
 * Component displaying the welcome screen.
 * @module profile.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ backend.profile.username }}</h2>
        <button type="button" class="btn btn-primary" (click)="logout()">{{ 'profile.logout' | translate }}</button>

        <div class="table-responsive">
        <table class="table table-condensed table-bordered">
            <thead>
                <tr>
                    <th>{{ 'profile.data_name' | translate }}</th>
                    <th>{{ 'profile.data' | translate }}</th>
                    <th>{{ 'profile.action' | translate }}</th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let d of dataNames()">
                    <td>{{ d }}</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td><input type="text" [(ngModel)]="data_name" name="s0" class="form-control"></td>
                    <td><input type="text" [(ngModel)]="data_value" name="s1" class="form-control"></td>
                    <td><button type="button" class="btn btn-default" (click)="register()">{{ 'profile.record' | translate }}</button></td>
                </tr>
            </tbody>
        </table>
    `
})
export class Profile implements OnInit {

    public data_name: string;
    public data_value: string;

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
        var self = this;
        if(!this.backend.profile)
            this.router.navigate(['']);
        this.backend.listData().then(function(add) {
            self.backend.profile.data = add.data;
            self.backend.profile.shared_with_me = add.shared_with_me;
        }, function(e) {
            console.log("Cannot retrieve data");
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
            self.router.navigate(['']);
        }, function(e) {
            console.log("Cannot log out.");
        });
    }

    /**
     * Register a new data.
     * @function register
     * @public
     */
    register() {
        var self = this;
        var garbled = this.backend.encryptAES(this.data_value);
        this.backend.postData(this.data_name, garbled).then(function(res) {
            self.backend.profile.data[self.data_name] = {
                id: res._id,
                length: 0,
                shared_to: {}
            }
            self.data_name = '';
            self.data_value = '';
        }, function(e) {
            console.log("Cannot register new value.");
        });
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @return {Array} Known fields.
     */
    dataNames() {
        var keys = [];
        if(!!this.backend.profile) {
            for (var key in this.backend.profile.data) {
                if (this.backend.profile.data.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
        }
        return keys;
    }
    
}
