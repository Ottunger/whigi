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
import {Savekey} from './subcmpts/savekey.component';
import {Filesystem} from './subcmpts/filesystem.component';
import {Notfound} from './subcmpts/notfound.component';
import {Profileguard, Fullguard, Vaultguard} from './guards.service';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: 'profile', component: Profile, canActivate: [Profileguard]},
    {path: 'filesystem/:mode', component: Filesystem, canActivate: [Profileguard], canDeactivate: [Profileguard]},
    {path: 'data/:name', component: Dataview, canActivate: [Fullguard], canDeactivate: [Fullguard]},
    {path: 'vault/:email/:id', component: Vaultview, canActivate: [Vaultguard]},
    {path: 'password-recovery/:key/:recup_mail', component: Reset},
    {path: 'save-key/:mail/:key_frg', component: Savekey, canActivate: [Profileguard]},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [

];
export const routing = RouterModule.forRoot(appRoutes);