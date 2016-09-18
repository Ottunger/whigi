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
        <p *ngIf="!!user.company_info && !!user.company_info.bce">{{ 'userinfo.bce' | translate }}{{ user.company_info.bce }}</p>
        <p *ngIf="!!user.company_info && !!user.company_info.rrn">{{ 'generics.rrn' | translate }}: {{ user.company_info.rrn }}</p>
        <p *ngIf="!!user.company_info && getAddr() != ''">{{ 'userinfo.addr' | translate }}: {{ getAddr() }}</p>

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
                    {{ 'userinfo.bce' | translate }}<br />
                    <input type="text" [(ngModel)]="bce" name="n2" class="form-control">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" (click)="modify()">{{ 'userinfo.modify' | translate }}</button>
                    <button type="submit" class="btn btn-default" (click)="load()">{{ 'userinfo.load' | translate }}</button>
                    <button type="button" class="btn btn-primary" (click)="goCompany()">{{ 'userinfo.goCompany' | translate }}</button>
                    <button type="button" class="btn btn-default" [disabled]="user.is_company != 9" (click)="goBCE()">{{ 'userinfo.goBCE' | translate }}</button>
                </div>
            </form>
        </div>
    `
})
export class Userinfo {

    @Input() user: any;
    public bce: string;

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
            self.backend.profile.is_company = 1;
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
        if(!!this.backend.profile.data['profile/last_name'] && !!this.backend.profile.data['profile/first_name']) {
            this.backend.getData(this.backend.profile.data['profile/last_name'].id).then(function(data) {
                var encr_data = self.backend.str2arr(data.encr_data);
                self.backend.decryptAES(encr_data, self.dataservice.workerMgt(false, function(lname) {
                    self.backend.getData(self.backend.profile.data['profile/last_name'].id).then(function(data) {
                        var encr_data = self.backend.str2arr(data.encr_data);
                        self.backend.decryptAES(encr_data, self.dataservice.workerMgt(false, function(fname) {
                            self.backend.profile.company_info.name = fname + ' ' + lname;
                            self.modify();
                        }));
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
                    });
                }));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
        }
    }

    /**
     * Computes adress
     * @function getAddr
     * @public
     * @return {String} Address.
     */
    getAddr(): string {
        if(!!this.user.company_info && !!this.user.company_info.address) {
            var ret = JSON.parse(this.user.company_info.address);
            return ret['generics.street'] + ' ' + ret['generics.num'] + ', ' + ret['generics.postcode'] + ' ' + ret['generics.city']; 
        }
        return '';
    }

    /**
     * Moves to goCompany.
     * @function goCompany
     * @public
     */
    goCompany() {
        window.location.href = 'https://' + this.backend.profile._id + ':' + localStorage.getItem('psha') + '@' + this.backend.EID_HOST;
    }

    /**
     * Sets company name from BCE code.
     * @function goBCE
     * @public
     */
    goBCE() {
        var self = this;
        this.backend.goBCE(this.bce).then(function() {
            self.notif.success(self.translate.instant('success'), self.translate.instant('userinfo.changed'));
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('userinfo.notChanged'));
        });
    }

}
