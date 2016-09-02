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
        <p>{{ 'actual' | translate }}</p>
        <input id="decrypted" *ngIf="decr_data.length < 150" type="text" [ngModel]="decr_data" class="form-control" readonly>
        <input id="decrypted" *ngIf="decr_data.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
        <button type="button" class="btn btn-primary" [disabled]="decr_data==''" (click)="dl()">{{ 'download' | translate }}</button>
        <button type="button" class="btn btn-primary btn-copier" data-clipboard-target="#decrypted">{{ 'copy' | translate }}</button>
        <br />
    `
})
export class Clearview {

    @Input() data_name: string;
    @Input() decr_data: string;
    @Input() is_dated: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService) {
        new window.Clipboard('.btn-copier');
    }

    /**
     * Prompts for downloading.
     * @function dl
     * @public
     */
    dl() {
        var spl = this.data_name.split('/');
        window.download(this.decr_data, spl[spl.length - 1]);
    }

}
