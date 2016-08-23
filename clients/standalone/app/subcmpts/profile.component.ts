/**
 * Component displaying the welcome screen.
 * @module profile.component
 * @author Mathonet Grégoire
 */

'use strict';
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from '../app.service';
enableProdMode();

@Component({
    template: `
        <h2>{{ backend.profile.username }}</h2>
    `
})
export class Profile implements OnInit {

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router) {

    }
    
}
