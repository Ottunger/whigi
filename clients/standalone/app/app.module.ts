/**
 * Loading for delegated services and bootstraping of components.
 * @module app.module
 * @author Mathonet Grégoire
 */

'use strict';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from 'ng2-translate/ng2-translate';
import {SimpleNotificationsModule} from 'angular2-notifications';
import {routing, appRoutingProviders} from './app.routing';

import {Backend} from './app.service';
import {Data} from './data.service';
import {Authguard, Profileguard, Fullguard} from './guards.service';

import {Application} from './app.component';
import {Logging} from './subcmpts/logging.component';
import {Profile} from './subcmpts/profile.component';
import {Dataview} from './subcmpts/dataview.component';
import {Vaultview} from './subcmpts/vaultview.component';
import {Reset} from './subcmpts/reset.component';
import {Notfound} from './subcmpts/notfound.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        TranslateModule.forRoot(),
        SimpleNotificationsModule,
        routing
    ],
    declarations: [
        Application,
        Logging,
        Profile,
        Dataview,
        Vaultview,
        Reset,
        Notfound
    ],
    providers: [
        appRoutingProviders,
        Backend,
        Data,
        Authguard,
        Profileguard,
        Fullguard
    ],
    bootstrap: [Application]
})
export class AppModule {



}