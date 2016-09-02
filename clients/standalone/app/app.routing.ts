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
import {Oauth} from './subcmpts/oauth.component';
import {Grant} from './subcmpts/grant.component';
import {Resethelp} from './subcmpts/resethelp.component';
import {Notfound} from './subcmpts/notfound.component';
import {Profileguard, Fullguard, Vaultguard} from './guards.service';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: 'end', component: Logging},
    {path: 'profile', component: Profile, canActivate: [Profileguard]},
    {path: 'filesystem/:mode', component: Filesystem, canActivate: [Profileguard], canDeactivate: [Profileguard]},
    {path: 'data/:name', component: Dataview, canActivate: [Fullguard], canDeactivate: [Fullguard]},
    {path: 'vault/:username/:id', component: Vaultview, canActivate: [Vaultguard]},
    {path: 'password-help/:id/:data_name', component: Resethelp, canActivate: [Profileguard]},
    {path: 'password-recovery/:id/:pwd', component: Reset},
    {path: 'save-key/:key/:value/:return_url', component: Savekey, canActivate: [Profileguard]},
    {path: 'oauth/:for_id/:prefix/:token/:return_url_ok/:return_url_deny', component: Oauth, canActivate: [Profileguard]},
    {path: 'grant/:id_to/:data_list/:return_url_ok/:return_url_deny/:expire_epoch', component: Grant, canActivate: [Profileguard]},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [

];
export const routing = RouterModule.forRoot(appRoutes);