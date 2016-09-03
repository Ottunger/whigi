/**
 * Component displaying the generic values
 * @module generics.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, ApplicationRef} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ 'generics.title' | translate }}</h2>
        <button type="button" class="btn btn-primary" (click)="router.navigate(['/profile'])">{{ 'back' | translate }}</button>
        <br />

        <div class="table-responsive">
            <table class="table table-condensed table-bordered">
                <thead>
                    <tr>
                        <th>{{ 'filesystem.data_name' | translate }}</th>
                        <th>{{ 'filesystem.data' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let g of generics()">
                        <td>{{ g }}</td>

                        <td *ngIf="!!backend.profile.data[g]">
                            <i>{{ 'filesystem.mix' | translate }}</i>
                        </td>
                        <td *ngIf="!backend.profile.data[g] && !backend.generics[g].is_file">
                            <input type="text" [(ngModel)]="data_value" name="s1" class="form-control">
                        </td>
                        <td *ngIf="!backend.profile.data[g] && backend.generics[g].is_file">
                            <input type="file" (change)="fileLoad($event)" name="n50" class="form-control">
                        </td>

                        <td *ngIf="!!backend.profile.data[g]">
                            <button type="button" class="btn btn-default" (click)="select(g)">{{ 'filesystem.goTo' | translate }}</button>
                        </td>
                        <td *ngIf="!backend.profile.data[g] && !backend.generics[g].is_file">
                            <button type="button" class="btn btn-default" (click)="register(g, false)">{{ 'filesystem.record' | translate }}</button>
                        </td>
                        <td *ngIf="!backend.profile.data[g] && backend.generics[g].is_file">
                            <button type="button" class="btn btn-default" (click)="register(g, true)" [disabled]="data_value_file==''">{{ 'filesystem.record' | translate }}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
})
export class Generics implements OnInit {

    public data_value: string;
    public data_value_file: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService,
        private dataservice: Data, private check: ApplicationRef) {

    }

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {String} name Name of recorded file.
     * @param {Boolean} as_file Load from file.
     */
    register(name: string, as_file: boolean) {
        var self = this, send;
        if(this.backend.generics[name].is_dated) {
            send = JSON.stringify([{
                value: as_file? this.data_value_file : this.data_value,
                from: (new Date).getTime()
            }]);
        } else {
            send = as_file? this.data_value_file : this.data_value;
        }
        this.dataservice.newData(name, send, this.backend.generics[name].is_dated).then(function() {
            self.data_value = '';
            self.data_value_file = '';
            self.check.tick();
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
        });
    }

    /**
     * Navigate to details panel.
     * @function select
     * @public
     * @param {String} name Name of data.
     */
    select(name: string) {
        this.router.navigate(['/data', window.encodeURIComponent(name), {
            to_filesystem: false
        }]);
    }

    /**
     * Returns the keys of generics.
     * @function generics
     * @public
     * @return {String[]} Keys.
     */
    generics(): string[] {
        return Object.getOwnPropertyNames(this.backend.generics);
    }

    /**
     * Loads a file as data.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     */
    fileLoad(e: any) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            self.data_value_file = r.result;
        }
        r.readAsDataURL(file);
    }
    
}
