db.createUser({user: 'admin', pwd: 'highersec@envict', roles:[{role:'userAdminAnyDatabase', db:'admin'}]})
use whigi
db.createUser({user:'whigiuser', pwd:'sorryMeND3dIoKwR',roles:[{role:'userAdmin', db:'whigi'}]})

db.users.update({_id: 'whigi-restore'}, {
    _id: 'whigi-restore',
    data: {},
    shared_with_me: {},
    rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    is_company: 9,
    company_info: {
        name: 'Whigi Restore System',
        request: {'Whigi': 'requests.restoreLine'},
        is_company: true
    },
    hidden_id: 'shortersook2'
}, {upsert: true})
db.users.update({_id: 'whigi-gwp'}, {
    _id: 'whigi-gwp',
    data: {},
    shared_with_me: {},
    rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    is_company: 9,
    company_info: {
        name: 'Whigi Giveaway System',
        request: {'Whigi': 'requests.gwpLine'},
        is_company: true
    },
    hidden_id: 'shortersook1'
}, {upsert: true})
db.users.update({_id: 'whigi-wissl'}, {
    _id: 'whigi-wissl',
    data: {},
    shared_with_me: {},
    rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    is_company: 9,
    company_info: {
        name: 'Whigi and Wissl Systems',
        request: {'Whigi': 'requests.whigiLine'},
        is_company: true
    },
    hidden_id: 'shortersook0'
}, {upsert: true})



db.users.update({_id: 'whigi-advert-world'}, {
    _id: 'whigi-advert-world',
    data: {},
    shared_with_me: {},
    rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    is_company: 9,
    company_info: {
        name: 'Whigi Advert World',
        request: {'Whigi': 'requests.advLine'},
        is_company: true
    },
    hidden_id: 'shortersookworld'
}, {upsert: true})
db.users.update({_id: 'whigi-advert-bel'}, {
    _id: 'whigi-advert-bel',
    data: {},
    shared_with_me: {},
    rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    is_company: 9,
    company_info: {
        name: 'Whigi Advert Belgium',
        request: {'Whigi': 'requests.advLine'},
        is_company: true
    },
    hidden_id: 'shortersookbelgium'
}, {upsert: true})

use whigi-advert-world
db.campaigns.createIndex({location: '2dsphere'})
use whigi-advert-bel
db.campaigns.createIndex({location: '2dsphere'})