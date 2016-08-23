/**
 * Service to reach the backend.
 * @module app.service
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Injectable} from '@angular/core';
import {Headers, Http, Response} from '@angular/http';
import * as toPromise from 'rxjs/add/operator/toPromise';

@Injectable()
export class Backend {

    public profile: any;
    private master_key: any;
    private BASE_URL = 'https://localhost/api/v1/';
    private RESTORE_URL = 'https://localhost/api/v1';

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param http HTTP service.
     */
    constructor(private http: Http) {

    }

    /**
     * Return an array from the first values of a string giving an AES key.
     * @function toBytes
     * @private
     * @param {String} data String.
     * @return {Bytes} Bytes.
     */
    private toBytes(data: string): number[] {
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
     * Encrypt a string using master_key in AES.
     * @function encryptAES
     * @public
     * @param {String} data Data to encrypt.
     * @return {Bytes} Encrypted data.
     */
    encryptAES(data: string): number[] {
        if(!this.master_key) {
            var key = this.toBytes(sessionStorage.getItem('key_decryption'));
            var decrypter = new window.aesjs.ModeOfOperation.ctr(key, new window.aesjs.Counter(0));
            this.master_key = decrypter.decrypt(this.profile.encr_master_key);
        }
        var encrypter = new window.aesjs.ModeOfOperation.ctr(this.master_key, new window.aesjs.Counter(0));
        return encrypter.encrypt(window.aesjs.util.convertStringToBytes(data));
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
     * @param {Boolean} nd Is it last time to try.
     * @param {Function} ok Resolve method for retry.
     * @param {function} nok Reject method for retry.
     * @return {Promise} The result. On error, a description can be found in e.msg.
     */
    private backend(whigi: boolean, method: string, data: any, url: string, auth: boolean, token: boolean, puzzle?: boolean, nd?: boolean, ok?: Function, nok?: Function): Promise {
        var call, puzzle = puzzle || false, self = this, dest;
        var headers: Headers = new Headers();

        function accept(resolve, response) {
            var res = response.json();
            if('puzzle' in res) {
                sessionStorage.setItem('puzzle', res.puzzle);
            }
            resolve(res);
        }
        function retry(e, resolve, reject) {
            self.recordPuzzle(e);
            self.backend(whigi, method, data, url, auth, token, puzzle, true, resolve, reject);
        }
        function deny(reject, e) {
            self.recordPuzzle(e);
            reject(e);
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
                if(nd) {
                    self.http.post(dest, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        deny(nok, e);
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
                if(nd) {
                    self.http.delete(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        deny(nok, e);
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
                if(nd) {
                    self.http.get(dest, {headers: headers}).toPromise().then(function(response) {
                        accept(ok, response);
                    }).catch(function(e) {
                        deny(nok, e);
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
     * @function getUser
     * @public
     * @param {String} userid Request id.
     * @return {Promise} JSON response from backend.
     */
    getUser(userid: string): Promise {
        return this.backend(true, 'GET', {}, 'user/' + userid, true, true, true);
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
     * @return {Promise} JSON response from backend.
     */
    postData(name: string, encr_data: number[]): Promise {
        return this.backend(true, 'POST', {
            name: name,
            encr_data: encr_data
        }, 'profile/data/new', true, true, true);
    }

    /**
     * Updates the password of the user.
     * @function updateProfile
     * @public
     * @param {String} password New password.
     * @param {Bytes} encr_master_key Master key locally encrypted.
     * @return {Promise} JSON response from backend.
     */
    updateProfile(password: string, encr_master_key: number[]): Promise {
        return this.backend(true, 'POST', {
            password: window.sha256(password),
            encr_master_key: encr_master_key
        }, 'profile/update', true, true);
    }

    /**
     * Creates a new user.
     * @function createUser
     * @public
     * @param {String} first_name First name.
     * @param {String} last_name Last name.
     * @param {String} username Username.
     * @param {String} password Password.
     * @param {String} email Email.
     * @return {Promise} JSON response from backend.
     */
    createUser(first_name: string, last_name: string, username: string, password: string, email: string): Promise {
        return this.backend(true, 'POST', {
            first_name: first_name,
            last_name: last_name,
            username: username,
            password: password,
            email: email
        }, 'user/create' + this.regCaptcha(), false, false);
    }

    /**
     * Activates a user using a key.
     * @function activateUser
     * @public
     * @param {String} key The key.
     * @return {Promise} JSON response from backend.
     */
    activateUser(key: string): Promise {
        return this.backend(true, 'GET', {}, 'activate/' + key, false, false);
    }

    /**
     * Deactivates the logged in user.
     * @function deactivateUser
     * @public
     * @return {Promise} JSON response from backend.
     */
    deactivateUser(): Promise {
        return this.backend(true, 'DELETE', {}, 'profile/deactivate', true, true);
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
     * @return {Promise} JSON response from backend.
     */
    removeTokens(): Promise {
        return this.backend(true, 'DELETE', {}, 'profile/token', true, true);
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
     * Shares a data between users.
     * @function createVault
     * @public
     * @param {String} data_name Data name.
     * @param {String} shared_to_id Id of person with who to share.
     * @param {Bytes} data_crypted_aes Locally crypted data using a freshly generated AES key.
     * @param {String} aes_crypted_shared_pub Locally crypted new AES key using remote public RSA key.
     * @return {Promise} JSON response from backend.
     */
    createVault(data_name: string, shared_to_id: string, data_crypted_aes: number[], aes_crypted_shared_pub: string): Promise {
        return this.backend(true, 'POST', {
            data_name: data_name,
            shared_to_id: shared_to_id,
            data_crypted_aes: data_crypted_aes,
            aes_crypted_shared_pub: aes_crypted_shared_pub
        }, 'vault/new', true, true, true);
    }

    /**
     * Revokes an access granted to a vault.
     * @function revokeVault
     * @public
     * @param {String} data_name Data name.
     * @param {String} shared_to_id Person with who we shared.
     * @return {Promise} JSON response from backend.
     */
    revokeVault(data_name: string, shared_to_id: string): Promise {
        return this.backend(true, 'DELETE', {}, 'vault/' + data_name + '/' + shared_to_id, true, true);
    }

    /**
     * Retrieves a data shared.
     * @function getVault
     * @public
     * @param {String} data_name Data name.
     * @param {String} sharer_id Person who shares.
     * @return {Promise} JSON response from backend.
     */
    getVault(data_name: string, sharer_id: string): Promise {
        return this.backend(true, 'GET', {}, 'vault/' + data_name + '/' + sharer_id, true, true, true);
    }

    /**
     * Returns the time the remote person accessed the vault.
     * @function getAccessVault
     * @public
     * @param {String} data_name Data name.
     * @param {String} shared_to_id Person with who we shared.
     * @return {Promise} JSON response from backend.
     */
    getAccessVault(data_name: string, shared_to_id: string): Promise {
        return this.backend(true, 'GET', {}, 'vault/time/' + data_name + '/' + shared_to_id, true, true);
    }

    /**
     * Asks for a reset link.
     * @function requestRestore
     * @public
     * @param {String} email Email.
     * @return {Promise} JSON response from backend.
     */
    requestRestore(email: string): Promise {
        return this.backend(false, 'GET', {}, 'request/' + email, false, false);
    }

    /**
     * Use a reset link.
     * @function getRestore
     * @public
     * @param {String} token Token.
     * @return {Promise} JSON response from backend.
     */
    getRestore(token: string): Promise {
        return this.backend(false, 'GET', {}, 'key/' + token, false, false);
    }

}