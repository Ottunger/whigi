/**
 * Component displaying the main page.
 * @module app.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
enableProdMode();

@Component({
    selector: 'my-app',
    template: `
        <div class="row bottom-border">
            <div class="col-sm-offset-3 col-sm-4">
                <router-outlet></router-outlet>
            </div>
        </div>
        <div class="row bottom-border">
            <div class="col-sm-offset-3 col-sm-4">
                <div class="btn-toolbar" role="toolbar" aria-label="">
                    <div class="btn-group" role="group" aria-label="">
                        <button type="button" class="btn btn-small" (click)="setLang('en')">English</button>
                        <button type="button" class="btn btn-small" (click)="setLang('fr')">Français</button>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Application {

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
            translate.setDefaultLang(sessionStorage.getItem('lang'));
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
