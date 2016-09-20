/**
 * Component displaying the main page.
 * @module app.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
enableProdMode();

@Component({
    selector: 'my-app',
    template: `
        <div class="row bottom-border">
            <div class="col-sm-offset-1 col-sm-10">
                <router-outlet></router-outlet>
            </div>
        </div>
        <br />
        <br />
        <div class="row bottom-border">
            <div class="col-sm-offset-1 col-sm-10">
                <div class="btn-toolbar" role="toolbar" aria-label="">
                    <div class="btn-group" role="group" aria-label="">
                        <button type="button" class="btn btn-small" (click)="setLang('en')">English</button>
                        <button type="button" class="btn btn-small" (click)="setLang('fr')">Français</button>
                    </div>
                </div>
            </div>
        </div>
        <simple-notifications [options]="options"></simple-notifications>
    `
})
export class Application {

    public options = {
        timeOut: 4000,
        lastOnBottom: true,
        clickToClose: true,
        maxLength: 0,
        maxStack: 4,
        showProgressBar: true,
        pauseOnHover: true,
        preventDuplicates: false,
        preventLastDuplicates: "visible",
        rtl: false,
        animate: "scale",
        position: ["right", "bottom"]
    };

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     */
    constructor(private translate: TranslateService) {
        translate.addLangs(['en', 'fr']);
        translate.setDefaultLang('en');

        if('lang' in sessionStorage) {
            translate.use(sessionStorage.getItem('lang'));
        } else {
            var browserLang = translate.getBrowserLang();
            translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
        }
    }

    /**
     * Changes the language for the app.
     * @function setLang
     * @public
     * @param {String} lang New language.
     */
    setLang(lang: string) {
        sessionStorage.setItem('lang', lang);
        this.translate.use(lang);
    }
    
}
