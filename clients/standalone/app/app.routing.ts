/**
 * In browser routing parameters.
 * @module app.routing
 * @author Mathonet Grégoire
 */

'use strict';
import {Routes, RouterModule} from '@angular/router';
import {Logging} from './subcmpts/logging.component';
import {Profile} from './subcmpts/profile.component';
import {Dataview} from './subcmpts/dataview.component';
import {Vaultview} from './subcmpts/vaultview.component';
import {Reset} from './subcmpts/reset.component';
import {Notfound} from './subcmpts/notfound.component';
import {Authguard, Profileguard, Fullguard} from './guards.service';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: 'profile', component: Profile, canActivate: [Profileguard], canDeactivate: [Profileguard]},
    {path: 'data/:name', component: Dataview, canActivate: [Fullguard], canDeactivate: [Fullguard]},
    {path: 'vault/:email/:name', component: Vaultview, canActivate: [Fullguard]},
    {path: 'password-recovery/:key', component: Reset},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [

];
export const routing = RouterModule.forRoot(appRoutes);