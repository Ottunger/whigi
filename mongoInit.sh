db.createUser({user: 'admin', pwd: 'highersec@envict', roles:[{role:'userAdminAnyDatabase', db:'admin'}]})
use whigi
use whigi-restore
db.createUser({user:'whigiuser', pwd:'sorryMeND3dIoKwR',roles:[{role:'userAdmin', db:['whigi', 'whigi-restore']}]})
