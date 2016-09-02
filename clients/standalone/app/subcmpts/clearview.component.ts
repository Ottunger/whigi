/**
 * Component to display the decrypted data.
 * @module clearview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
enableProdMode();

@Component({
    selector: 'clear-view',
    template: `
        <div *ngIf="!is_dated">
            <p>{{ 'actual' | translate }}</p>
            <input id="decrypted" *ngIf="decr_data.length < 150" type="text" [ngModel]="decr_data" class="form-control" readonly>
            <input id="decrypted" *ngIf="decr_data.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
            <button type="button" class="btn btn-primary" [disabled]="decr_data==''" (click)="dl(decr_data)">{{ 'download' | translate }}</button>
            <button type="button" class="btn btn-primary btn-copier" data-clipboard-target="#decrypted">{{ 'copy' | translate }}</button>
            <br />
        </div>
        <div *ngIf="is_dated">
            <div *ngFor="let p of computeValues()">
                <p>{{ 'actualFrom' | translate }}{{ p.from }}</p>
                <input *ngIf="p.value.length < 150" type="text" [ngModel]="p.value" class="form-control" readonly>
                <input *ngIf="p.value.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
                <button type="button" class="btn btn-primary" (click)="dl(p.value)">{{ 'download' | translate }}</button>
            </div>
        </div>
    `
})
export class Clearview {

    @Input() data_name: string;
    @Input() decr_data: string;
    @Input() is_dated: boolean;
    private values: {from: Date, value: string}[];

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService) {
        this.values = undefined;
        new window.Clipboard('.btn-copier');
    }

    /**
     * Called for parsing.
     * @function computeValues
     * @public
     */
    computeValues(): {from: Date, value: string}[] {
        if(!this.values) {
            this.values = JSON.parse(this.decr_data);
            for(var i = 0; i < this.values.length; i++)
                this.values[i].from = new Date(this.values[i].from);
            if(this.values.length == 0)
                this.values = undefined;
        }
        return this.values;
    }

    /**
     * Prompts for downloading.
     * @function dl
     * @public
     * @param {String} data Data to download.
     */
    dl(data: string) {
        var spl = this.data_name.split('/');
        window.download(data, spl[spl.length - 1]);
    }

}
