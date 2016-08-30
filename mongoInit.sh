db.createUser({user: 'admin', pwd: 'highersec@envict', roles:[{role:'userAdminAnyDatabase', db:'admin'}]})
use whigi
use whigi-restore
db.createUser({user:'whigiuser', pwd:'sorryMeND3dIoKwR',roles:[{role:'userAdmin', db:['whigi', 'whigi-restore']}]})

use whigi
db.users.update({username: 'Ottun'}, {
   _id: '1',
   username: 'Ottun',
   password: 'fb6504919b63efd8204ca74095a8c49a8faf4260a65503d7454c997276ad98ca',
   salt: 'salt',
   encr_master_key: 'aes',
   email: 'greg.mathonet@gmail.com',
   data: {},
   shared_with_me: {},
   is_activated: true,
   encr_master_key: [239, 123, 142, 200, 135, 148, 97, 195, 15, 136, 33, 213, 99, 247, 45, 48, 254, 68, 67, 217, 90, 3, 20, 67, 122, 205, 43, 212, 97, 213, 141, 220],
   rsa_pub_key: '-----BEGIN PUBLIC KEY-----' +
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN' +
        'FOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76' +
        'xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4' +
        'gwQco1KRMDSmXSMkDwIDAQAB' +
        '-----END PUBLIC KEY-----',
    rsa_pri_key: [162,20,73,126,186,148,221,108,127,171,194,58,61,141,66,33],
    preferences: {email_on_share: true}
}, {upsert: true})
db.users.update({username: 'Ottun2'}, {
   _id: '2',
   username: 'Ottun2',
   password: 'fb6504919b63efd8204ca74095a8c49a8faf4260a65503d7454c997276ad98ca',
   salt: 'salt',
   encr_master_key: 'aes',
   email: 'gregoire.mathonet@envict.com',
   data: {},
   shared_with_me: {},
   is_activated: true,
   encr_master_key: [239, 123, 142, 200, 135, 148, 97, 195, 15, 136, 33, 213, 99, 247, 45, 48, 254, 68, 67, 217, 90, 3, 20, 67, 122, 205, 43, 212, 97, 213, 141, 220],
   rsa_pub_key: '-----BEGIN PUBLIC KEY-----' +
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN' +
        'FOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76' +
        'xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4' +
        'gwQco1KRMDSmXSMkDwIDAQAB' +
        '-----END PUBLIC KEY-----',
    rsa_pri_key: [162,20,73,126,186,148,221,108,127,171,194,58,61,141,66,33],
    preferences: {email_on_share: true}
}, {upsert: true})
