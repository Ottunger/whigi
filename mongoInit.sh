db.createUser({user: 'admin', pwd: 'highersec@envict', roles:[{role:'userAdminAnyDatabase', db:'admin'}]})
use whigi
db.createUser({user:'whigiuser', pwd:'sorryMeND3dIoKwR',roles:[{role:'userAdmin', db:'whigi'}]})

db.users.update({_id: 'whigi-restore'}, {
   _id: 'whigi-restore',
   password: 'fdf0d8ca0d28574a62e42d81afdb15d1e171386c3438fce633286cde48cf1818',
   salt: 'UpzkuVtj8rlz2ZBmJtNHZbWRtiDNWnHGlNTVRJoCymvvg8mnE4zMt9Uukj8R8MKQ',
   data: {},
   cert: '',
   shared_with_me: {},
   encr_master_key: [43, 190, 248, 102, 10, 136, 210, 184, 123, 191, 147, 15, 241, 190, 157, 194, 23, 46, 193, 135, 9, 182, 132, 235, 193, 177, 114, 132, 69, 34, 22, 227],
   rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    rsa_pri_key: [[237, 105, 227, 25, 48, 114, 40, 112, 50, 212, 144, 65, 42, 196, 231, 78, 36, 232, 127, 80, 174, 198, 67, 194, 227, 0, 101, 132, 234, 195, 91, 32, 91, 196, 140, 43, 97, 207, 191, 167, 93, 202, 224, 104, 113, 57, 144, 248, 182, 122, 187, 71, 237, 197, 23, 181, 154, 97, 70, 241, 94, 217, 35, 2, 250, 119, 194, 13, 3, 146, 108, 193, 75, 118, 10, 227, 0, 108, 225, 119, 197, 206, 89, 93, 134, 246, 5, 162, 23, 15, 87, 118, 80, 51, 64, 53, 26, 147, 133, 216, 26, 236, 223, 150, 185, 211, 131, 92, 109, 222, 146, 74, 215, 15, 98, 115, 114, 169, 112, 1, 88, 27, 222, 209, 189, 189, 219, 45, 185, 129, 30, 204, 184, 159, 52, 220, 219, 190, 172, 34, 67, 51, 252, 15, 149, 115, 60, 204, 100, 215, 34, 71, 33, 160, 61, 209, 144, 52, 153, 41, 205, 89, 56, 196, 86, 160, 214, 139, 243, 138, 52, 153, 212, 8, 192, 212, 88, 189, 124, 41, 74, 112, 238, 193, 60, 44, 82, 153, 16, 219, 150, 193, 192, 27, 149, 251, 92, 25, 208, 128, 162, 176, 208, 251, 148, 43, 32, 24, 229, 93, 216, 154, 143, 2, 9, 178, 254, 10, 253, 62, 28, 137, 15, 103, 208, 112, 97, 198, 7, 208, 68, 58, 242, 142, 194, 240, 183, 131, 1, 253, 233, 122, 202, 244, 142, 196, 197, 78, 52, 162, 69, 44, 208, 6, 88, 118, 87, 231, 194, 85, 125, 201, 190, 230, 112, 171, 185, 246, 171, 182, 247, 97, 164, 185, 58, 132, 62, 45, 109, 195, 22, 209, 16, 188, 248, 250, 125, 105, 226, 29, 171, 206, 34, 3, 255, 193, 181, 51, 8, 105, 210, 69, 169, 19, 201, 21, 14, 251, 77, 173, 92, 14, 116, 92, 184, 6, 188, 195, 224, 25, 112, 224, 9, 108, 220, 105, 49, 64, 191, 237, 164, 223, 145, 153, 86, 85, 44, 219, 161, 39, 139, 150, 189, 112, 53, 203, 149, 123, 11, 142, 41, 203, 120, 20, 32, 90, 105, 88, 66, 51, 228, 6, 82, 213, 180, 230, 204, 255, 79, 50, 104, 112, 32, 38, 130, 245, 247, 229, 28, 210, 36, 184, 148, 143, 230, 82, 102, 41, 3, 20, 112, 0, 151, 32, 52, 74, 231, 102, 11, 216, 208, 19, 228, 234, 206, 126, 151, 11, 114, 26, 37, 14, 67, 40, 144, 79, 191, 46, 72, 60, 161, 37, 145, 160, 89, 176, 215, 91, 212, 251, 232, 176, 92, 126, 5, 196, 5, 249, 13, 131, 59, 54, 182, 165, 1, 17, 248, 177, 245, 201, 200, 231, 22, 14, 186, 64, 87, 181, 61, 75, 27, 115, 44, 41, 100, 99, 3, 120, 177, 33, 41, 189, 169, 236, 134, 242, 146, 13, 43, 134, 88, 140, 35, 1, 88, 136, 72, 99, 237, 22, 233, 149, 62, 210, 75, 133, 187, 219, 74, 199, 227, 58, 138, 98, 44, 67, 182, 9, 237, 86, 99, 151, 156, 174, 73, 103, 202, 79, 223, 242, 119, 8, 44, 22, 163, 54, 171, 53, 195, 130, 83, 237, 23, 168, 110, 119, 251, 237, 113, 16, 177, 20, 98, 177, 192, 40, 242, 112, 44, 236, 123, 73, 4, 87, 211, 37, 83, 19, 75, 190, 56, 170, 167, 87, 18, 185, 96, 194, 115, 88, 125, 112, 8, 156, 99, 109, 48, 151, 196, 98, 3, 45, 191, 231, 243, 238, 100, 138, 161, 129, 59, 48, 110, 23, 190, 88, 57, 104, 87, 120, 33, 183, 94, 40, 112, 91, 80, 151, 199, 23, 0, 82, 193, 194, 174, 129, 177, 212, 138, 168, 2, 82, 57, 99, 59, 65, 153, 199, 126, 208, 67, 105, 80, 228, 214, 217, 227, 220, 54, 65, 212, 64, 111, 199, 61, 203, 242, 72, 192, 139, 72, 140, 233, 104, 43, 227, 253, 177, 151, 82, 18, 150, 75, 108, 145, 177, 8, 115, 100, 205, 99, 119, 118, 0, 40, 180, 234, 65, 151, 43, 112, 119, 250, 224, 158, 250, 164, 75, 94, 138, 34, 89, 47, 180, 84, 190, 205, 130, 242, 93, 104, 23, 115, 138, 82, 16, 220, 116, 232, 237, 180, 188, 194, 124, 174, 87, 209, 112, 122, 40, 163, 246, 240, 41, 64, 254, 15, 202, 115, 226, 221, 190, 126, 84, 41, 30, 195, 190, 46, 64, 65, 92, 14, 125, 109, 33, 57, 59, 150, 211, 252, 195, 174, 251, 243, 86, 208, 184, 141, 123, 82, 184, 75, 152, 217, 220, 71, 236, 190, 119, 244, 205, 191, 34, 182, 86, 251, 206, 187, 189, 31, 153, 12, 2, 49, 229, 46, 212, 63, 125, 198, 249, 163, 87, 194, 204, 135, 4, 236, 176, 39, 102, 220, 108, 85, 111, 183, 136, 244, 92, 108, 149, 243, 131, 35, 174, 151, 55, 173, 253, 241, 252, 251, 237, 251, 21, 38, 28, 239, 142, 225, 9, 157, 59, 68, 84, 228, 65, 114, 75, 44, 69, 82, 214, 9, 151, 52, 96, 199, 138, 173, 149, 98, 73, 22, 177, 165, 145, 117, 212, 71, 142, 245, 161, 130, 20, 222, 226, 129, 80, 75, 240, 45, 118, 67, 81, 188, 114, 175, 153, 200, 173, 221, 79, 100, 147]],
    is_company: 9,
    company_info: {
        name: 'Whigi Restore'
    }
}, {upsert: true})
db.users.update({_id: 'whigi-giveaway'}, {
   _id: 'whigi-giveaway',
   password: 'fdf0d8ca0d28574a62e42d81afdb15d1e171386c3438fce633286cde48cf1818',
   salt: 'UpzkuVtj8rlz2ZBmJtNHZbWRtiDNWnHGlNTVRJoCymvvg8mnE4zMt9Uukj8R8MKQ',
   data: {},
   cert: '',
   shared_with_me: {},
   encr_master_key: [43, 190, 248, 102, 10, 136, 210, 184, 123, 191, 147, 15, 241, 190, 157, 194, 23, 46, 193, 135, 9, 182, 132, 235, 193, 177, 114, 132, 69, 34, 22, 227],
   rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    rsa_pri_key: [[237, 105, 227, 25, 48, 114, 40, 112, 50, 212, 144, 65, 42, 196, 231, 78, 36, 232, 127, 80, 174, 198, 67, 194, 227, 0, 101, 132, 234, 195, 91, 32, 91, 196, 140, 43, 97, 207, 191, 167, 93, 202, 224, 104, 113, 57, 144, 248, 182, 122, 187, 71, 237, 197, 23, 181, 154, 97, 70, 241, 94, 217, 35, 2, 250, 119, 194, 13, 3, 146, 108, 193, 75, 118, 10, 227, 0, 108, 225, 119, 197, 206, 89, 93, 134, 246, 5, 162, 23, 15, 87, 118, 80, 51, 64, 53, 26, 147, 133, 216, 26, 236, 223, 150, 185, 211, 131, 92, 109, 222, 146, 74, 215, 15, 98, 115, 114, 169, 112, 1, 88, 27, 222, 209, 189, 189, 219, 45, 185, 129, 30, 204, 184, 159, 52, 220, 219, 190, 172, 34, 67, 51, 252, 15, 149, 115, 60, 204, 100, 215, 34, 71, 33, 160, 61, 209, 144, 52, 153, 41, 205, 89, 56, 196, 86, 160, 214, 139, 243, 138, 52, 153, 212, 8, 192, 212, 88, 189, 124, 41, 74, 112, 238, 193, 60, 44, 82, 153, 16, 219, 150, 193, 192, 27, 149, 251, 92, 25, 208, 128, 162, 176, 208, 251, 148, 43, 32, 24, 229, 93, 216, 154, 143, 2, 9, 178, 254, 10, 253, 62, 28, 137, 15, 103, 208, 112, 97, 198, 7, 208, 68, 58, 242, 142, 194, 240, 183, 131, 1, 253, 233, 122, 202, 244, 142, 196, 197, 78, 52, 162, 69, 44, 208, 6, 88, 118, 87, 231, 194, 85, 125, 201, 190, 230, 112, 171, 185, 246, 171, 182, 247, 97, 164, 185, 58, 132, 62, 45, 109, 195, 22, 209, 16, 188, 248, 250, 125, 105, 226, 29, 171, 206, 34, 3, 255, 193, 181, 51, 8, 105, 210, 69, 169, 19, 201, 21, 14, 251, 77, 173, 92, 14, 116, 92, 184, 6, 188, 195, 224, 25, 112, 224, 9, 108, 220, 105, 49, 64, 191, 237, 164, 223, 145, 153, 86, 85, 44, 219, 161, 39, 139, 150, 189, 112, 53, 203, 149, 123, 11, 142, 41, 203, 120, 20, 32, 90, 105, 88, 66, 51, 228, 6, 82, 213, 180, 230, 204, 255, 79, 50, 104, 112, 32, 38, 130, 245, 247, 229, 28, 210, 36, 184, 148, 143, 230, 82, 102, 41, 3, 20, 112, 0, 151, 32, 52, 74, 231, 102, 11, 216, 208, 19, 228, 234, 206, 126, 151, 11, 114, 26, 37, 14, 67, 40, 144, 79, 191, 46, 72, 60, 161, 37, 145, 160, 89, 176, 215, 91, 212, 251, 232, 176, 92, 126, 5, 196, 5, 249, 13, 131, 59, 54, 182, 165, 1, 17, 248, 177, 245, 201, 200, 231, 22, 14, 186, 64, 87, 181, 61, 75, 27, 115, 44, 41, 100, 99, 3, 120, 177, 33, 41, 189, 169, 236, 134, 242, 146, 13, 43, 134, 88, 140, 35, 1, 88, 136, 72, 99, 237, 22, 233, 149, 62, 210, 75, 133, 187, 219, 74, 199, 227, 58, 138, 98, 44, 67, 182, 9, 237, 86, 99, 151, 156, 174, 73, 103, 202, 79, 223, 242, 119, 8, 44, 22, 163, 54, 171, 53, 195, 130, 83, 237, 23, 168, 110, 119, 251, 237, 113, 16, 177, 20, 98, 177, 192, 40, 242, 112, 44, 236, 123, 73, 4, 87, 211, 37, 83, 19, 75, 190, 56, 170, 167, 87, 18, 185, 96, 194, 115, 88, 125, 112, 8, 156, 99, 109, 48, 151, 196, 98, 3, 45, 191, 231, 243, 238, 100, 138, 161, 129, 59, 48, 110, 23, 190, 88, 57, 104, 87, 120, 33, 183, 94, 40, 112, 91, 80, 151, 199, 23, 0, 82, 193, 194, 174, 129, 177, 212, 138, 168, 2, 82, 57, 99, 59, 65, 153, 199, 126, 208, 67, 105, 80, 228, 214, 217, 227, 220, 54, 65, 212, 64, 111, 199, 61, 203, 242, 72, 192, 139, 72, 140, 233, 104, 43, 227, 253, 177, 151, 82, 18, 150, 75, 108, 145, 177, 8, 115, 100, 205, 99, 119, 118, 0, 40, 180, 234, 65, 151, 43, 112, 119, 250, 224, 158, 250, 164, 75, 94, 138, 34, 89, 47, 180, 84, 190, 205, 130, 242, 93, 104, 23, 115, 138, 82, 16, 220, 116, 232, 237, 180, 188, 194, 124, 174, 87, 209, 112, 122, 40, 163, 246, 240, 41, 64, 254, 15, 202, 115, 226, 221, 190, 126, 84, 41, 30, 195, 190, 46, 64, 65, 92, 14, 125, 109, 33, 57, 59, 150, 211, 252, 195, 174, 251, 243, 86, 208, 184, 141, 123, 82, 184, 75, 152, 217, 220, 71, 236, 190, 119, 244, 205, 191, 34, 182, 86, 251, 206, 187, 189, 31, 153, 12, 2, 49, 229, 46, 212, 63, 125, 198, 249, 163, 87, 194, 204, 135, 4, 236, 176, 39, 102, 220, 108, 85, 111, 183, 136, 244, 92, 108, 149, 243, 131, 35, 174, 151, 55, 173, 253, 241, 252, 251, 237, 251, 21, 38, 28, 239, 142, 225, 9, 157, 59, 68, 84, 228, 65, 114, 75, 44, 69, 82, 214, 9, 151, 52, 96, 199, 138, 173, 149, 98, 73, 22, 177, 165, 145, 117, 212, 71, 142, 245, 161, 130, 20, 222, 226, 129, 80, 75, 240, 45, 118, 67, 81, 188, 114, 175, 153, 200, 173, 221, 79, 100, 147]],
    is_company: 9,
    company_info: {
        name: 'Whigi Giveaway'
    }
}, {upsert: true})
db.users.update({_id: 'whigi-gwp'}, {
   _id: 'whigi-gwp',
   password: 'fdf0d8ca0d28574a62e42d81afdb15d1e171386c3438fce633286cde48cf1818',
   salt: 'UpzkuVtj8rlz2ZBmJtNHZbWRtiDNWnHGlNTVRJoCymvvg8mnE4zMt9Uukj8R8MKQ',
   data: {},
   cert: '',
   shared_with_me: {},
   encr_master_key: [43, 190, 248, 102, 10, 136, 210, 184, 123, 191, 147, 15, 241, 190, 157, 194, 23, 46, 193, 135, 9, 182, 132, 235, 193, 177, 114, 132, 69, 34, 22, 227],
   rsa_pub_key: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCmL1BWiJEUXOrOPAnMM6VM7Iy3\nmAV5hOsP1lIj/6lDzpQ3Q+7fPkG8jBHHoSJM3wLWNtKQMBpu0VsxFnoMIuwkVc/+\nvZj7nlYMBLrSqOZfY8FBSrOt7Xv+IvgiYgShBAG4L9bVp5ABJGcsoZnEDa1TfW2H\nlwoPk7sd5wmY7J6f9wIDAQAB\n-----END PUBLIC KEY-----',
    rsa_pri_key: [[237, 105, 227, 25, 48, 114, 40, 112, 50, 212, 144, 65, 42, 196, 231, 78, 36, 232, 127, 80, 174, 198, 67, 194, 227, 0, 101, 132, 234, 195, 91, 32, 91, 196, 140, 43, 97, 207, 191, 167, 93, 202, 224, 104, 113, 57, 144, 248, 182, 122, 187, 71, 237, 197, 23, 181, 154, 97, 70, 241, 94, 217, 35, 2, 250, 119, 194, 13, 3, 146, 108, 193, 75, 118, 10, 227, 0, 108, 225, 119, 197, 206, 89, 93, 134, 246, 5, 162, 23, 15, 87, 118, 80, 51, 64, 53, 26, 147, 133, 216, 26, 236, 223, 150, 185, 211, 131, 92, 109, 222, 146, 74, 215, 15, 98, 115, 114, 169, 112, 1, 88, 27, 222, 209, 189, 189, 219, 45, 185, 129, 30, 204, 184, 159, 52, 220, 219, 190, 172, 34, 67, 51, 252, 15, 149, 115, 60, 204, 100, 215, 34, 71, 33, 160, 61, 209, 144, 52, 153, 41, 205, 89, 56, 196, 86, 160, 214, 139, 243, 138, 52, 153, 212, 8, 192, 212, 88, 189, 124, 41, 74, 112, 238, 193, 60, 44, 82, 153, 16, 219, 150, 193, 192, 27, 149, 251, 92, 25, 208, 128, 162, 176, 208, 251, 148, 43, 32, 24, 229, 93, 216, 154, 143, 2, 9, 178, 254, 10, 253, 62, 28, 137, 15, 103, 208, 112, 97, 198, 7, 208, 68, 58, 242, 142, 194, 240, 183, 131, 1, 253, 233, 122, 202, 244, 142, 196, 197, 78, 52, 162, 69, 44, 208, 6, 88, 118, 87, 231, 194, 85, 125, 201, 190, 230, 112, 171, 185, 246, 171, 182, 247, 97, 164, 185, 58, 132, 62, 45, 109, 195, 22, 209, 16, 188, 248, 250, 125, 105, 226, 29, 171, 206, 34, 3, 255, 193, 181, 51, 8, 105, 210, 69, 169, 19, 201, 21, 14, 251, 77, 173, 92, 14, 116, 92, 184, 6, 188, 195, 224, 25, 112, 224, 9, 108, 220, 105, 49, 64, 191, 237, 164, 223, 145, 153, 86, 85, 44, 219, 161, 39, 139, 150, 189, 112, 53, 203, 149, 123, 11, 142, 41, 203, 120, 20, 32, 90, 105, 88, 66, 51, 228, 6, 82, 213, 180, 230, 204, 255, 79, 50, 104, 112, 32, 38, 130, 245, 247, 229, 28, 210, 36, 184, 148, 143, 230, 82, 102, 41, 3, 20, 112, 0, 151, 32, 52, 74, 231, 102, 11, 216, 208, 19, 228, 234, 206, 126, 151, 11, 114, 26, 37, 14, 67, 40, 144, 79, 191, 46, 72, 60, 161, 37, 145, 160, 89, 176, 215, 91, 212, 251, 232, 176, 92, 126, 5, 196, 5, 249, 13, 131, 59, 54, 182, 165, 1, 17, 248, 177, 245, 201, 200, 231, 22, 14, 186, 64, 87, 181, 61, 75, 27, 115, 44, 41, 100, 99, 3, 120, 177, 33, 41, 189, 169, 236, 134, 242, 146, 13, 43, 134, 88, 140, 35, 1, 88, 136, 72, 99, 237, 22, 233, 149, 62, 210, 75, 133, 187, 219, 74, 199, 227, 58, 138, 98, 44, 67, 182, 9, 237, 86, 99, 151, 156, 174, 73, 103, 202, 79, 223, 242, 119, 8, 44, 22, 163, 54, 171, 53, 195, 130, 83, 237, 23, 168, 110, 119, 251, 237, 113, 16, 177, 20, 98, 177, 192, 40, 242, 112, 44, 236, 123, 73, 4, 87, 211, 37, 83, 19, 75, 190, 56, 170, 167, 87, 18, 185, 96, 194, 115, 88, 125, 112, 8, 156, 99, 109, 48, 151, 196, 98, 3, 45, 191, 231, 243, 238, 100, 138, 161, 129, 59, 48, 110, 23, 190, 88, 57, 104, 87, 120, 33, 183, 94, 40, 112, 91, 80, 151, 199, 23, 0, 82, 193, 194, 174, 129, 177, 212, 138, 168, 2, 82, 57, 99, 59, 65, 153, 199, 126, 208, 67, 105, 80, 228, 214, 217, 227, 220, 54, 65, 212, 64, 111, 199, 61, 203, 242, 72, 192, 139, 72, 140, 233, 104, 43, 227, 253, 177, 151, 82, 18, 150, 75, 108, 145, 177, 8, 115, 100, 205, 99, 119, 118, 0, 40, 180, 234, 65, 151, 43, 112, 119, 250, 224, 158, 250, 164, 75, 94, 138, 34, 89, 47, 180, 84, 190, 205, 130, 242, 93, 104, 23, 115, 138, 82, 16, 220, 116, 232, 237, 180, 188, 194, 124, 174, 87, 209, 112, 122, 40, 163, 246, 240, 41, 64, 254, 15, 202, 115, 226, 221, 190, 126, 84, 41, 30, 195, 190, 46, 64, 65, 92, 14, 125, 109, 33, 57, 59, 150, 211, 252, 195, 174, 251, 243, 86, 208, 184, 141, 123, 82, 184, 75, 152, 217, 220, 71, 236, 190, 119, 244, 205, 191, 34, 182, 86, 251, 206, 187, 189, 31, 153, 12, 2, 49, 229, 46, 212, 63, 125, 198, 249, 163, 87, 194, 204, 135, 4, 236, 176, 39, 102, 220, 108, 85, 111, 183, 136, 244, 92, 108, 149, 243, 131, 35, 174, 151, 55, 173, 253, 241, 252, 251, 237, 251, 21, 38, 28, 239, 142, 225, 9, 157, 59, 68, 84, 228, 65, 114, 75, 44, 69, 82, 214, 9, 151, 52, 96, 199, 138, 173, 149, 98, 73, 22, 177, 165, 145, 117, 212, 71, 142, 245, 161, 130, 20, 222, 226, 129, 80, 75, 240, 45, 118, 67, 81, 188, 114, 175, 153, 200, 173, 221, 79, 100, 147]],
    is_company: 9,
    company_info: {
        name: 'Whigi Giveaway WP User'
    }
}, {upsert: true})
