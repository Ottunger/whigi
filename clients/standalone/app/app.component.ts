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
    
}
