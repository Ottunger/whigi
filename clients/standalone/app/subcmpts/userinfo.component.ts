/**
 * Component to display the public info of a user.
 * @module userinfo.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, ApplicationRef} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();

@Component({
    selector: 'user-info',
    template: `
        <h2>{{ 'userinfo.title' | translate }}</h2>
        <h3>{{ 'userinfo.trustLevel' | translate }}{{ user.is_company }}</h3>
        <h3>{{ 'userinfo.public' | translate }}</h3>
        <p *ngIf="!!user.company_info && !!user.company_info.name">{{ 'userinfo.name' | translate }}{{ user.company_info.name }}</p>

        <div *ngIf="user._id == backend.profile._id">
            <form class="form-signin">
                <div class="heading">
                    <h3 class="form-signin-heading">{{ 'userinfo.set' | translate }}</h3>
                </div>
                <div class="form-group">
                    {{ 'userinfo.name' | translate }}<br />
                    <input type="text" [(ngModel)]="backend.profile.company_info.name" name="n1" class="form-control">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" (click)="modify()">{{ 'userinfo.modify' | translate }}</button>
                    <button type="submit" class="btn btn-default" (click)="load()">{{ 'userinfo.load' | translate }}</button>
                </div>
            </form>
        </div>
    `
})
export class Userinfo {

    @Input() user: any;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend App service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend,
        private dataservice: Data, private check: ApplicationRef) {

    }

    /**
     * Modify public data
     * @function modify
     * @public
     */
    modify() {
        var self = this;
        this.backend.goCompany(self.backend.profile.company_info).then(function() {
            self.notif.success(self.translate.instant('success'), self.translate.instant('userinfo.changed'));
            self.check.tick();
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('userinfo.notChanged'));
            self.check.tick();
        });
    }

    /**
     * Load public data
     * @function load
     * @public
     */
    load() {
        var self = this;
        if(!!this.backend.profile.data['profile/last_name']) {
            this.backend.getData(this.backend.profile.data['profile/last_name'].id).then(function(data) {
                var encr_data = self.backend.str2arr(data.encr_data);
                self.backend.decryptAES(encr_data, self.dataservice.workerMgt(false, function(got) {
                    self.backend.profile.company_info.name = got;
                    self.modify();
                }));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
        }
    }

}
