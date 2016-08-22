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
import {routing, appRoutingProviders} from './app.routing';
import {TranslateModule} from 'ng2-translate/ng2-translate';
import {Backend} from './app.service';
import {Application} from './app.component';
import {Logging} from './logging.component';
import {Notfound} from './notfound.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        TranslateModule.forRoot(),
        routing
    ],
    declarations: [
        Application,
        Logging,
        Notfound
    ],
    providers: [
        appRoutingProviders,
        Backend
    ],
    bootstrap: [Application]
})
export class AppModule {



}