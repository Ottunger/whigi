/**
 * Service to see if user has passed requirements.
 * @module guards.service
 * @author Mathonet Grégoire
 */

'use strict';
import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {Router, CanDeactivate} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {Backend} from './app.service';
import {Profile} from './subcmpts/profile.component';

@Injectable()
export class Authguard implements CanActivate {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param router Router.
     */
    constructor(private router: Router) {

    }

    /**
     * Checks the guard.
     * @function canActivate
     * @public
     * @return {Boolean} Can go through.
     */
    canActivate() {
        if(!!sessionStorage.getItem('token') && !!sessionStorage.getItem('key_decryption'))
            return true;
        this.router.navigate(['/']);
        return false;
    }

}

@Injectable()
export class Profileguard implements CanActivate, CanDeactivate<Profile> {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Router.
     * @param translate Translation service.
     */
    constructor(private backend: Backend, private router: Router, private translate: TranslateService) {

    }

    /**
     * Checks the guard.
     * @function canActivate
     * @public
     * @return {Boolean} Can go through.
     */
    canActivate() {
        if(!!sessionStorage.getItem('token') && !!sessionStorage.getItem('key_decryption') && !!this.backend.profile)
            return true;
        this.router.navigate(['/']);
        return false;
    }

    /**
     * Checks the guard.
     * @function canDeactivate
     * @public
     * @param component Component.
     * @param route Actual route.
     * @param state Actual state.
     * @return {Boolean} Can go through.
     */
    canDeactivate(component: Profile, route: any, state: any): Observable<boolean> | Promise<boolean> | boolean {
        if((!!component.data_name && component.data_name.length == 0) &&
            (!!component.data_value && component.data_value.length == 0)) {
            return true;
        }
        if(!!component.new_email && component.new_email.length == 0)
            return true;
        return component.dialog(this.translate.instant('confirmation'));
    }

}

@Injectable()
export class Fullguard implements CanActivate {

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Router.
     */
    constructor(private backend: Backend, private router: Router) {

    }

    /**
     * Checks the guard.
     * @function canActivate
     * @public
     * @return {Boolean} Can go through.
     */
    canActivate() {
        if(!!sessionStorage.getItem('token') && !!sessionStorage.getItem('key_decryption') && !!this.backend.profile
            && !!this.backend.profile.data && !!this.backend.profile.shared_with_me)
            return true;
        this.router.navigate(['/profile']);
        return false;
    }

}