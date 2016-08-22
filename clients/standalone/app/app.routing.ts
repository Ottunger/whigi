/**
 * In browser routing parameters.
 * @module app.routing
 * @author Mathonet Grégoire
 */

'use strict';
import {Routes, RouterModule} from '@angular/router';
import {Logging} from './logging.component';
import {Notfound} from './notfound.component';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [

];
export const routing = RouterModule.forRoot(appRoutes);