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
import {Resethelp} from './subcmpts/resethelp.component';
import {Account} from './subcmpts/account.component';
import {Remote} from './subcmpts/remote.component';
import {Generics} from './subcmpts/generics.component';
import {Logginglight} from './subcmpts/logginglight.component';
import {User} from './subcmpts/user.component';
import {Notfound} from './subcmpts/notfound.component';
import {Profileguard, Fullguard} from './guards.service';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: 'end', component: Logginglight},
    {path: 'llight', component: Logginglight},
    {path: 'profile', component: Profile, canActivate: [Profileguard]},
    {path: 'profile/eidok', component: Profile, canActivate: [Profileguard]},
    {path: 'user/:id', component: User, canActivate: [Profileguard]},
    {path: 'user/:id/:ret', component: User, canActivate: [Profileguard]},
    {path: 'filesystem/:mode', component: Filesystem, canActivate: [Profileguard], canDeactivate: [Profileguard]},
    {path: 'data/:name', component: Dataview, canActivate: [Fullguard], canDeactivate: [Fullguard]},
    {path: 'vault/:username/:id', component: Vaultview, canActivate: [Fullguard]},
    {path: 'password-help/:id/:data_name', component: Resethelp, canActivate: [Profileguard]},
    {path: 'password-recovery/:id/:pwd', component: Reset},
    {path: 'save-key/:key/:value/:is_dated/:return_url', component: Savekey, canActivate: [Fullguard]},
    {path: 'oauth/:for_id/:prefix/:token/:return_url_ok/:return_url_deny', component: Oauth, canActivate: [Profileguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account', component: Account, canActivate: [Profileguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account/:data_list/:expire_epoch', component: Account, canActivate: [Profileguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account/:data_list/:expire_epoch/:trigger', component: Account, canActivate: [Profileguard]},
    {path: 'remote/:id_to/:challenge/:return_url', component: Remote, canActivate: [Profileguard]},
    {path: 'generics', component: Generics, canActivate: [Fullguard], canDeactivate: [Fullguard]},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [
    
];
export const routing = RouterModule.forRoot(appRoutes);