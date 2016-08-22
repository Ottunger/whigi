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

    private BASE_URL = 'https://localhost/api/v1/';

    /**
     * Creates the service.
     * @function constructor
     * @public
     * @param http HTTP service.
     */
    constructor(private http: Http) {

    }

    /**
     * Returns the result of a call to the backend.
     * @function backend
     * @private
     * @param {String} method Method to use.
     * @param {Object} data JSON body.
     * @param {String} url URL suffix.
     * @param {Boolean} auth Whether auth is needed.
     * @param {Boolean} token Consider auth using token. Else expect data.username and data.password to be set.
     * @param {Boolean} nd Is it last time to try.
     * @return {Promise} The result.
     */
    private backend(method: string, data: any, url: string, auth: boolean, token: boolean, nd?: boolean): Promise {
        function accept(resolve, response) {
            var res = response.json();
            if('puzzle' in res) {
                sessionStorage.setItem('puzzle', res.puzzle);
            }
            resolve(res);
        }
        function deny(reject, e) {
            var res = e.json() || {};
            if('puzzle' in res) {
                sessionStorage.setItem('puzzle', res.puzzle);
            }
            if(nd) {
                reject(e);
            } else {
                return self.backend(method, data, url, auth, token, true);
            }
        }

        var call, self = this;
        var headers: Headers = new Headers();
        switch(method) {
            case 'post':
            case 'POST':
                call = self.http.post;
                headers['Content-Type'] = 'application/json';
                break;
            case 'delete':
            case 'DELETE':
                call = self.http.delete;
                break;
            case 'get':
            case 'GET':
            default:
                call = self.http.get;
                break;
        }
        if(auth && token) {
            headers['Authorization'] = 'Bearer ' + btoa(sessionStorage.getItem('token'));
        } else if(auth) {
            headers['Authorization'] = 'Basic ' + btoa(data.username + ':' + data.password);
        }
        headers['Accept-Language'] = (('lang' in sessionStorage)? sessionStorage.getItem('lang') : 'en') + ';q=1'

        if(call == this.http.post) {
            return new Promise(function(resolve, reject) {
                call(self.BASE_URL + url, JSON.stringify(data), {headers: headers}).toPromise().then(function(response) {
                    accept(resolve, response);
                }, function(e) {
                    deny(reject, e);
                });
            });
        } else {
            return new Promise(function(resolve, reject) {console.log("here");
                var c = call(self.BASE_URL + url, {headers: headers});
                console.log(c);
                c.toPromise().then(function(response) {
                    accept(resolve, response);
                }, function(e) {
                    deny(reject, e);
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
        do {
            complete = window.sha256(sessionStorage.getItem('puzzle') + i);
            i++;
        } while(complete.charAt(0) != '0' || complete.charAt(1) != '0' || complete.charAt(2) != '0' || complete.charAt(3) != '0');
        return "?puzzle=" + (i - 1);
    }
    
    /**
     * Solves the server captcha, then return a string for it.
     * @function regCaptcha
     * @private
     * @return {String} Captcha solution.
     */
    private regCaptcha(): string {
        var v = window.grecaptcha.getResponse();
        return "?captcha=" + v;
    }

    getProfile(username: string, password: string): Promise {
        return this.backend('GET', {
            username: username,
            password: window.sha256(password)
        }, 'profile', true, false);
    }

}