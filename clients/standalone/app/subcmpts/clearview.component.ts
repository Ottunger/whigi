/**
 * Component to display the decrypted data.
 * @module clearview.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, Output, EventEmitter} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    selector: 'clear-view',
    template: `
        <h3 *ngIf="is_generic">{{ backend.generics[gen_name][version].descr_key | translate }}</h3><br />
        <div *ngIf="!is_dated">
            <p>{{ 'actual' | translate }}</p>
            <div *ngIf="!is_folder">
                <input id="decrypted" *ngIf="decr_data.length < 150" type="text" [ngModel]="decr_data" class="form-control" readonly>
                <input id="decrypted" *ngIf="decr_data.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
            </div>
            <div *ngIf="is_folder">
                <div class="form-group" *ngFor="let k of backend.generics[gen_name][version].json_keys">
                    {{ k | translate }}<br />
                    <input type="text" [ngModel]="recover(k, decr_data)" name="s1" class="form-control" readonly>
                </div>
            </div>

            <button type="button" class="btn btn-primary" [disabled]="decr_data==''" (click)="dl(decr_data)">{{ 'download' | translate }}</button>
            <button type="button" *ngIf="!is_folder && decr_data.length < 150" class="btn btn-primary btn-copier" data-clipboard-target="#decrypted">{{ 'copy' | translate }}</button>
            <br />
        </div>
        <div *ngIf="is_dated">
            <div *ngFor="let p of computeValues(); let i = index">
                <div>{{ 'actualFrom' | translate }}
                    <div class='input-group date' id='pick-id{{ p }}'>
                        <input type='text' class="form-control" readonly="readonly"/>
                        <span class="input-group-addon">
                            <span class="glyphicon glyphicon-calendar"></span>
                        </span>
                    </div>
                </div>
                <div *ngIf="!is_folder">
                    <input *ngIf="p.value.length < 150" type="text" [ngModel]="p.value" class="form-control" readonly>
                    <input *ngIf="p.value.length >= 150" type="text" value="{{ 'dataview.tooLong' | translate }}" class="form-control" readonly>
                </div>
                <div *ngIf="is_folder">
                    <div class="form-group" *ngFor="let k of backend.generics[gen_name][version].json_keys">
                        {{ k | translate }}<br />
                        <input type="text" [ngModel]="recover(k, p.value)" name="s1" class="form-control" readonly>
                    </div>
                </div>

                <button type="button" class="btn btn-primary" (click)="dl(p.value)">{{ 'download' | translate }}</button>
                <button *ngIf="change" type="button" class="btn btn-warning" (click)="rem(i)" [disabled]="computeValues().length < 2">{{ 'remove' | translate }}</button>
            </div>
        </div>
    `
})
export class Clearview {

    @Input() data_name: string;
    @Input() decr_data: string;
    @Input() is_dated: boolean;
    @Input() change: boolean;
    @Input() is_folder: boolean;
    @Input() is_generic: boolean;
    @Input() version: number;
    @Input() gen_name: string;
    @Output() notify: EventEmitter<string>;
    private values: {from: Date, value: string}[];

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param check Check service.
     * @param backend App service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend) {
        this.values = undefined;
        this.notify = new EventEmitter<string>();
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
            for(var i = 0; i < this.values.length; i++) {
                window.$('#pick-id' + this.values[i]).datetimepicker();
                window.$('#pick-id' + this.values[i]).datetimepicker('date', window.moment(this.values[i].from));
                this.values[i].from = new Date(this.values[i].from);
            }
            if(this.values.length == 0)
                this.values = undefined;
        }
        return this.values;
    }

    /**
     * Removes a milestone.
     * @function rem
     * @public
     * @param {Number} i Index to remove.
     */
    rem(i: number) {
        this.values.splice(i, 1);
        this.notify.emit(JSON.stringify(this.values.map(function(el) {
            el.from = el.from.getTime();
            return el;
        })));
    }

    /**
     * Spreads a part of a folder generic content.
     * @function recover
     * @param {String} key Key.
     * @param {String} json JSON.
     * @return {String} Associated value.
     */
    recover(key: string, json: string): string {
        var ret = JSON.parse(json);
        return ret[key];
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
