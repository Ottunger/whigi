/**
 * In browser routing parameters.
 * @module app.routing
 * @author Mathonet Grégoire
 */

'use strict';
import {Routes, RouterModule} from '@angular/router';
import {Logging} from './subcmpts/logging.component';
import {Profile} from './subcmpts/profile.component';
import {Notfound} from './subcmpts/notfound.component';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: 'profile', component: Profile},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [

];
export const routing = RouterModule.forRoot(appRoutes);