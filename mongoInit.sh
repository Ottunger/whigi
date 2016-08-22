db.createUser({user: 'admin', pwd: 'highersec@envict', roles:[{role:'userAdminAnyDatabase', db:'admin'}]})
use whigi
use whigi-restore
db.createUser({user:'whigiuser', pwd:'sorryMeND3dIoKwR',roles:[{role:'userAdmin', db:['whigi', 'whigi-restore']}]})

use whigi
db.users.update({username: 'Ottun'}, {
   username: 'Ottun',
   password: 'fb6504919b63efd8204ca74095a8c49a8faf4260a65503d7454c997276ad98ca',
   salt: 'salt',
   encr_master_key: 'aes',
   email: 'greg.mathonet@gmail.com',
   data: {},
   shared_with_me: {},
   is_activated: true
}, {upsert: true})
