/**
 * Component displaying an error screen.
 * @module logging.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
enableProdMode();

@Component({
    template: `
        <h2>{{ 'error.notfound' | translate }}</h2>
    `
})
export class Notfound {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     */
    constructor(private translate: TranslateService) {
        
    }
    
}
