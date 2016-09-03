/**
 * Service to reach the backend.
 * @module app.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable} from '@angular/core';
import {Headers, Http, Response} from '@angular/http';
import {NotificationsService} from 'angular2-notifications';
import {TranslateService} from 'ng2-translate/ng2-translate';
import * as toPromise from 'rxjs/add/operator/toPromise';
import {Trie} from '../utils/Trie';

@Injectable()
export class Backend {

    public profile: any;
    public data_trie: Trie;
    public shared_with_me_trie: Trie;
    public data_loaded: boolean;
    public master_key: number[];
    public generics: {[id: string]: {
        is_dated: boolean,
        is_file: boolean,
        descr_key: string,
        regexp?: string,
        img_url?: string
    }};
    private rsa_key: string;
    private BASE_URL = 'https://localhost/api/v1/';
    private RESTORE_URL = 'https://localhost/api/v1';

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param http HTTP service.
     * @param notif Notification service.
     * @param translate Translation service.
     */
    constructor(private http: Http, private notif: NotificationsService, private translate: TranslateService) {
        var self = this;
        this.data_loaded = false;
        this.http.get('/app/generics.json').toPromise().then(function(response) {
            self.generics = response.json();
        });
    }

    /**
     * Return an array from the first values of a string giving an AES key.
     * @function toBytes
     * @public
     * @param {String} data String.
     * @return {Bytes} Bytes.
     */
     toBytes(data: string): number[] {
        function num(e) {
            if(e >= 65)
                return e - 55;
            else
                return e - 48;
        }

        var ret: number[] = [];
        try {
            for(var i = 0; i < 32; i++) {
                ret.push((num(data.charCodeAt(2*i)) * 16 + num(data.charCodeAt(2*i + 1))) % 256);
            }
        } catch(e) {
            return ret;
        }
        return ret;
    }

    /**
     * Turns an array of nums to a string.
     * @function arr2str
     * @public
     * @param {Number[]} arr Array.
     * @return {String} String.
     */
    arr2str(arr: number[]): string {
        var result = '';
        for (var i = 0; i < arr.length; i++) {
            result += String.fromCharCode(arr[i]);
        }
        return result;
    }

    /**
     * Turns a string to an array of numbers.
     * @function str2arr
     * @public
     * @param {String} str String.
     * @return {Number[]} Array.
     */
    str2arr(str: string): number[] {
        var result: number[] = [];
        for (var i = 0; i < str.length; i++) {
            result.push(window.parseInt(str.charCodeAt(i).toString(10)));
        }
        return result;
    }

    /**
     * Generates a random string.
     * @function generateRandomString
     * @public
     * @param {Number} length The length.
     * @return {String} The string.
     */
    generateRandomString(length) {
        var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var randomString = '';
        for (var i = 0; i < length; i++) {
            randomString += characters[Math.floor(Math.random() * characters.length)];
        }
        return randomString;
    }

    /**
     * Decrypts the master key once and for all.
     * @function decryptMaster
     * @public
     */
    decryptMaster() {
        try {
            var key = this.toBytes(sessionStorage.getItem('key_decryption'));
            var decrypter = new window.aesjs.ModeOfOperation.ctr(key, new window.aesjs.Counter(0));
            this.master_key = decrypter.decrypt(this.profile.encr_master_key);

            decrypter = new window.aesjs.ModeOfOperation.ctr(this.master_key, new window.aesjs.Counter(0));
            this.rsa_key = window.aesjs.util.convertBytesToString(decrypter.decrypt(this.profile.rsa_pri_key));
        } catch(e) {
            this.notif.alert(this.translate.instant('error'), this.translate.instant('noKey'));
        }
    }

    /**
     * Create a new AES key suitable after.
     * @function newAES
     * @public
     * @return {Bytes} Key.
     */
    newAES(): number[] {
        return this.toBytes(this.generateRandomString(64));
    }

    /**
     * Encrypt the master AES key using password derivated AES key.
     * @function encryptMasterAES
     * @public
     * @param {String} pwd Password.
     * @param {String} salt User salt.
     * @param {String} master_key Master key.
     * @return {Bytes} Encrypted master key.
     */
    encryptMasterAES(pwd: string, salt: string, master_key: string): number[] {
        return new window.aesjs.ModeOfOperation.ctr(this.toBytes(window.sha256(pwd + salt)), new window.aesjs.Counter(0))
            .encrypt(this.toBytes(master_key));
    }

    /**
     * Encrypt the master AES key using password derivated AES key.
     * @function encryptMasterAESAsNumber
     * @public
     * @param {String} pwd Password.
     * @param {String} salt User salt.
     * @param {Number[]} master_key Master key.
     * @return {Bytes} Encrypted master key.
     */
    private encryptMasterAESAsNumber(pwd: string, salt: string, master_key: number[]): number[] {
        return new window.aesjs.ModeOfOperation.ctr(this.toBytes(window.sha256(pwd + salt)), new window.aesjs.Counter(0)).encrypt(master_key);
    }

    /**
     * Encrypt a string using master_key in AES.
     * @function encryptAES
     * @public
     * @param {String} data Data to encrypt.
     * @param {Function} onmsg Worker handler.
     * @param {Bytes} key Key to use.
     * @return {Worker} Worker object.
     */
    encryptAES(data: string, onmsg: any,  key?: number[]): Worker {
        if(!this.master_key && !key) {
            this.decryptMaster();
        }
        key = key || this.master_key;
        var w = new Worker('/js/worker.js');
        w.onmessage = onmsg;
        w.postMessage([data, key, true]);
        return w;
    }

    /**
     * Decrypt a string using master_key in AES.
     * @function decryptAES
     * @public
     * @param {Bytes} data Data to decrypt.
     * @param {Function} onmsg Worker handler.
     * @param {Bytes} key Key to use.
     * @return {Worker} Worker object.
     */
    decryptAES(data: number[], onmsg: any, key?: number[]): Worker {
        if(!this.master_key && !key) {
            this.decryptMaster();
        }
        key = key || this.master_key;
        var w = new Worker('/js/worker.js');
        w.onmessage = onmsg;
        w.postMessage([data, key, false]);
        return w;
    }

    /**
     * Encrypt an AES key using RSA.
     * @function encryptRSA
     * @public
     * @param {Bytes} AES key to be encrypted.
     * @param {String} RSA public key.
     * @return {String} Encrypted data.
     */
    encryptRSA(data: number[], key: string): string {
        var enc = new window.JSEncrypt();
        enc.setPublicKey(key);
        return enc.encrypt(this.arr2str(data));
    }

    /**
     * Decrypt an AES key using RSA.
     * @function decryptRSA
     * @public
     * @param {String} Encrypted data.
     * @return {Bytes} Decrypted data, we use AES keys.
     */
    decryptRSA(data: string): number[] {
        if(!this.rsa_key) {
            this.decryptMaster();
        }
        var dec = new window.JSEncrypt();
        dec.setPrivateKey(this.rsa_key);
        dec = dec.decrypt(data);
        return this.str2arr(dec);
    }

    /**
     * Saves the current puzzle returned from server.
     * @function recordPuzzle
     * @private
     * @param e Response.
     */
    private recordPuzzle(e) {
        try {
            var res = e.json() || {};
            e.msg = res.error || '';
            if('puzzle' in res) {
                sessionStorage.setItem('puzzle', res.puzzle);
            }
        } catch(e) {}
    }

    /**
     * Returns the result of a call to the backend.
     * @function backend
     * @private
     * @param {Boolean} whigi True to come from Whigi base. Otherwise, use Whigi-restore.
     * @param {String} method Method to use.
     * @param {Object} data JSON body.
     * @param {String} url URL suffix.
     * @param {Boolean} auth Whether auth is needed.
     * @param {Boolean} token Consider auth using token. Else expect data.username and data.password to be set.
     * @param {Boolean} puzzle Require puzzle.
     * @param {Function} ok Resolve method for retry.
     * @param {Function} nok Reject method for retry.
     * @param {Number} num Number of retries.
     * @return {Promise} The result. On error, a description can be found in e.msg.
     */
    private backend(whigi: boolean, method: string, data: any, url: string, auth: boolean, token: boolean, puzzle?: boolean, ok?: Function, nok?: Function, num?: number): Promise {
        var call, puzzle = puzzle || false, self = this, dest;
        var headers: Headers = new Headers();
        num = num || 0;

        function accept(resolve, response) {
            var res = response.json();
            if('puzzle' in res) {
                sessionStorage.setItem('puzzle', res.puzzle);
            }
            resolve(res);
        }
        function retry(e, resolve, reject) {
            self.recordPuzzle(e);
            if(e.status == 412 && num < 4) {
                self.backend(whigi, method, data, url, auth, token, puzzle, resolve, reject, num + 1);
            } else {
                if(e.status == 401 && token) { 
                    window.location.href = '/end/';
                }
                reject(e);
            }
        }

        if(auth && token) {
            headers.append('Authorization', 'Bearer ' + btoa(sessionStorage.getItem('token')));
        } else if(auth) {
            headers.append('Authorization', 'Basic ' + btoa(data.username + ':' + data.password));
        }
        headers.append('Accept-Language', (('lang' in sessionStorage)? sessionStorage.getItem('lang') : 'en') + ';q=1');
        dest = (whigi? this.BASE_URL : this.RESTORE_URL) + url + (puzzle? this.regPuzzle() : '');

        switch(method) {
            case 'post':
            case 'POST':
                headers.append('Content-Type', 'application/json');
                if(!!ok && !!nok) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
                return new Promise(function(resolve, reject) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }).catch(function(e) {
                        retry(e, resolve, reject);
                    });
                });
            case 'delete':
            case 'DELETE':
                if(!!ok && !!nok) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
               return new Promise(function(resolve, reject) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }).catch(function(e) {
                        retry(e, resolve, reject);
                    });
                });
            case 'get':
            case 'GET':
            default:
                if(!!ok && !!nok) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        retry(e, ok, nok);
                    });
                    return;
                }
                return new Promise(function(resolve, reject) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(resolve, response);
                    }).catch(function(e) {
                        retry(e, resolve, reject);
                    });
                });
        }
    }

    /**
     * Solves the server puzzle, then return a string for it.
     * @function regPuzzle
     * @private
     * @return {String} Puzzle solution.
     */
    private regPuzzle(): string {
        var i = 0, complete;
        if(!('puzzle' in sessionStorage))
            return '?puzzle=0'
        do {
            complete = window.sha256(sessionStorage.getItem('puzzle') + i);
            i++;
        } while(complete.charAt(0) != '0' || complete.charAt(1) != '0' || complete.charAt(2) != '0' || complete.charAt(3) != '0');
        return '?puzzle=' + (i - 1);
    }
    
    /**
     * Solves the server captcha, then return a string for it.
     * @function regCaptcha
     * @private
     * @return {String} Captcha solution.
     */
    private regCaptcha(): string {
        var v = window.grecaptcha.getResponse();
        return '?captcha=' + v;
    }

    /**
     * Returns the public info of a user.
     * @function peekUser
     * @public
     * @param {String} known Request id.
     * @return {Promise} JSON response from backend.
     */
    peekUser(known: string): Promise {
        return this.backend(true, 'GET', {}, 'peek/' + window.encodeURIComponent(known), false, false);
    }

    /**
     * Returns the public info of a user.
     * @function getUser
     * @public
     * @param {String} known Request id.
     * @return {Promise} JSON response from backend.
     */
    getUser(known: string): Promise {
        return this.backend(true, 'GET', {}, 'user/' + window.encodeURIComponent(known), true, true, true);
    }

    /**
     * Returns the info of the logged in user.
     * @function getProfile
     * @public
     * @return {Promise} JSON response from backend.
     */
    getProfile(): Promise {
        return this.backend(true, 'GET', {}, 'profile', true, true);
    }

    /**
     * Posts info for company.
     * @function goCompany
     * @public
     * @param {Object} info Informations.
     * @return {Promise} JSON response from backend.
     */
    goCompany(info: any): Promise {
        return this.backend(true, 'POST', info, 'profile/info', true, true);
    }

    /**
     * Returns the data of the user.
     * @function listData
     * @public
     * @return {Promise} JSON response from backend.
     */
    listData(): Promise {
        return this.backend(true, 'GET', {}, 'profile/data', true, true);
    }

    /**
     * Posts a piece of data.
     * @function postData
     * @public
     * @param {String} name Data name.
     * @param {String} encr_data Locally crypted data.
     * @param {Boolean} is_dated True to register as a dated data.
     * @return {Promise} JSON response from backend.
     */
    postData(name: string, encr_data: number[], is_dated?: boolean): Promise {
        return this.backend(true, 'POST', {
            name: name,
            encr_data: this.arr2str(encr_data),
            is_dated: (!!is_dated)? is_dated : false
        }, 'profile/data/new', true, true, true);
    }

    /**
     * Updates the password and preferences of the user.
     * @function updateProfile
     * @public
     * @param {String} new_password New password.
     * @param {String} password Hash of current password for auth.
     * @return {Promise} JSON response from backend.
     */
    updateProfile(new_password: string, password: string): Promise {
        return this.backend(true, 'POST', {
            new_password: window.sha256(new_password),
            encr_master_key: this.encryptMasterAESAsNumber(new_password, this.profile.salt, this.master_key),
            username: this.profile.username,
            password: window.sha256(password)
        }, 'profile/update', true, false);
    }

    /**
     * Updates the password of the user after a reset.
     * @function updateProfileForReset
     * @public
     * @param {String} new_password New password.
     * @param {String} password Hash of current password for auth.
     * @return {Promise} JSON response from backend.
     */
    updateProfileForReset(new_password: string, encr_master_key: string): Promise {
        return this.backend(true, 'POST', {
            new_password: window.sha256(new_password),
            encr_master_key: encr_master_key
        }, 'profile/update', true, true);
    }

    /**
     * Creates a new user.
     * @function createUser
     * @public
     * @param {String} username Username.
     * @param {String} password Password.
     * @return {Promise} JSON response from backend.
     */
    createUser(username: string, password: string): Promise {
        return this.backend(true, 'POST', {
            username: username,
            password: password
        }, 'user/create' + this.regCaptcha(), false, false);
    }

    /**
     * Creates a new token for logging in.
     * @function createToken
     * @public
     * @param {String} username Username.
     * @param {String} password Password.
     * @param {Boolean} is_eternal Create a full token.
     * @return {Promise} JSON response from backend.
     */
    createToken(username: string, password: string, is_eternal: boolean): Promise {
        return this.backend(true, 'POST', {
            username: username,
            password: window.sha256(password),
            is_eternal: is_eternal
        }, 'profile/token/new', true, false, true);
    }

    /**
     * Invalidates tokens, logging out.
     * @function removeTokens
     * @public
     * @param {Boolean} all To remove all tokens.
     * @return {Promise} JSON response from backend.
     */
    removeTokens(all: boolean): Promise {
        return this.backend(true, 'DELETE', {}, 'profile/token' + (all? '' : ('?token=' + sessionStorage.getItem('token'))), true, true);
    }

    /**
     * Create an OAuth token.
     * @function createOAuth
     * @public
     * @param {String} for_id Given 3rd party name.
     * @param {String} prefix Prefix given.
     * @param {String} token Token for checking.
     * @return {Promise} JSON response from backend.
     */
    createOAuth(for_id: string, prefix: string, token: string): Promise {
        return this.backend(true, 'POST', {
            for_id: for_id,
            prefix: prefix,
            token: token
        }, 'oauth/new', true, true);
    }

    /**
     * Invalidates an OAuth token.
     * @function removeOAuth
     * @public
     * @param {String} id token id.
     * @return {Promise} JSON response from backend.
     */
    removeOAuth(id: string): Promise {
        return this.backend(true, 'DELETE', {}, 'oauth' + id, true, true);
    }

    /**
     * Retrieves a piece of data.
     * @function getData
     * @public
     * @param {String} dataid Request id.
     * @return {Promise} JSON response from backend.
     */
    getData(dataid: string): Promise {
        return this.backend(true, 'GET', {}, 'data/' + dataid, true, true);
    }

    /**
     * Deletes a piece of data.
     * @function getData
     * @public
     * @param {String} name Data name.
     * @return {Promise} JSON response from backend.
     */
    removeData(name: string): Promise {
        return this.backend(true, 'DELETE', {}, 'data/' + window.encodeURIComponent(name), true, true);
    }

    /**
     * Shares a data between users.
     * @function createVault
     * @public
     * @param {String} data_name Data name.
     * @param {String} shared_to_id Id of person with who to share.
     * @param {Bytes} data_crypted_aes Locally crypted data using a freshly generated AES key.
     * @param {String} aes_crypted_shared_pub Locally crypted new AES key using remote public RSA key.
     * @param {Number} expire_epoch Time for expiration.
     * @return {Promise} JSON response from backend.
     */
    createVault(data_name: string, shared_to_id: string, data_crypted_aes: number[], aes_crypted_shared_pub: string, expire_epoch?: number): Promise {
        return this.backend(true, 'POST', {
            data_name: data_name,
            shared_to_id: shared_to_id,
            data_crypted_aes: this.arr2str(data_crypted_aes),
            aes_crypted_shared_pub: aes_crypted_shared_pub,
            expire_epoch: (!!expire_epoch)? expire_epoch : 0
        }, 'vault/new', true, true, true);
    }

    /**
     * Revokes an access granted to a vault.
     * @function revokeVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    revokeVault(vault_id: string): Promise {
        return this.backend(true, 'DELETE', {}, 'vault/' + vault_id, true, true);
    }

    /**
     * Retrieves a data shared.
     * @function getVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    getVault(vault_id: string): Promise {
        return this.backend(true, 'GET', {}, 'vault/' + vault_id, true, true);
    }

    /**
     * Returns the time the remote person accessed the vault.
     * @function getAccessVault
     * @public
     * @param {String} vault_id Vault id.
     * @return {Promise} JSON response from backend.
     */
    getAccessVault(vault_id: string): Promise {
        return this.backend(true, 'GET', {}, 'vault/time/' + vault_id, true, true);
    }

    /**
     * Asks for a reset link.
     * @function requestRestore
     * @public
     * @param {String} id Id.
     * @return {Promise} JSON response from backend.
     */
    requestRestore(id: string): Promise {
        return this.backend(false, 'GET', {}, 'request/' + window.encodeURIComponent(id), false, false);
    }

    /**
     * Use a reset link.
     * @function mixRestore
     * @public
     * @param {String} id Requestant id.
     * @param {String} half Half password.
     * @return {Promise} JSON response from backend.
     */
    mixRestore(id: string, half: string): Promise {
        return this.backend(false, 'GET', {}, 'mix/' + window.encodeURIComponent(id) + '/' + window.encodeURIComponent(half), false, false);
    }

}