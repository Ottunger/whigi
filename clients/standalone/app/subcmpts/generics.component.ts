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

        <select class="form-control" [(ngModel)]="filter">
            <option *ngFor="let f of filters()" [value]="f">{{ f | translate }}</option>
        </select>
        <br />

        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>{{ 'filesystem.data_name' | translate }}</th>
                        <th>{{ 'generics.descr' | translate }}</th>
                        <th></th>
                        <th>{{ 'filesystem.data' | translate }}</th>
                        <th>{{ 'action' | translate }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let g of generics()">
                        <td>{{ g }}</td>
                        <td>{{ backend.generics[g].descr_key | translate }}</td>

                        <td *ngIf="!!backend.generics[g].img_url"><img src="{{ backend.generics[g].img_url }}" /></td>
                        <td *ngIf="!backend.generics[g].img_url"><img src="favicon.png" /></td>

                        <td *ngIf="!!backend.profile.data[g]">
                            <i>{{ 'filesystem.mix' | translate }}</i>
                        </td>
                        <td *ngIf="!backend.profile.data[g] && !backend.generics[g].is_file">
                            <input type="text" [(ngModel)]="new_data" name="s1" class="form-control">
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
                            <button type="button" class="btn btn-default" (click)="register(g, true)" [disabled]="new_data_file==''">{{ 'filesystem.record' | translate }}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
})
export class Generics implements OnInit {

    public new_data: string;
    public new_data_file: string;
    public filter: string;
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
        this.filter = 'generics.any';
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
        if(!!this.backend.generics[name].regexp) {
            var re = new RegExp(this.backend.generics[name].regexp);
            if(!re.test(this.new_data)) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('generics.regexp'));
                return;
            }
        }
        if(this.backend.generics[name].is_dated) {
            send = JSON.stringify([{
                value: as_file? this.new_data_file : this.new_data,
                from: (new Date).getTime()
            }]);
        } else {
            send = as_file? this.new_data_file : this.new_data;
        }
        this.dataservice.newData(name, send, this.backend.generics[name].is_dated).then(function() {
            self.new_data = '';
            self.new_data_file = '';
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
        this.router.navigate(['/data', window.encodeURIComponent(name)]);
    }

    /**
     * Returns all available filters.
     * @function filters
     * @public
     */
    filters(): string[] {
        var ret = ['generics.any'];
        for(var data in this.backend.generics) {
            if(ret.indexOf(this.backend.generics[data].module) < 0)
                ret.push(this.backend.generics[data].module);
        }
        return ret;
    }

    /**
     * Returns the keys of generics.
     * @function generics
     * @public
     * @return {String[]} Keys.
     */
    generics(): string[] {
        var self = this;
        if(this.filter == 'generics.any')
            return Object.getOwnPropertyNames(this.backend.generics);
        return Object.getOwnPropertyNames(this.backend.generics).filter(function(el): boolean {
            return self.backend.generics[el].module == self.filter;
        });
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
            self.new_data_file = r.result;
        }
        r.readAsDataURL(file);
    }
    
}
