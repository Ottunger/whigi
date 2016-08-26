/**
 * Class for simulating a response and monitor it.
 * @module FakeRes
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any

export class FakeRes {

    public end: number;
    public promise: Promise;
    private resolve: Function;
    private reject: Function;

    /**
     * Creates a non determined FakeRes.
     * @function constructor
     * @public
     * @param {Boolean} onJSON Return on JSON.
     */
    constructor(private onJSON: boolean) {
        var self = this;

        this.end = 0;
        this.promise = new Promise(function(resolve, reject) {
            self.resolve = resolve;
            self.reject = reject;
        });
    }

    /**
     * Useless for us.
     * @function type
     * @public
     * @param {String} dummy Input.
     */
    type(dummy: string) {
        return this;
    }

    /**
     * Useless for us.
     * @function json
     * @public
     * @param {Object} dummy Input.
     */
    json(dummy: any) {
        if(this.onJSON)
            this.resolve(dummy);
        return this;
    }

    /**
     * Saves the status.
     * @function status
     * @public
     * @param {Number} s Status.
     */
    status(s: number) {
        this.end = s;
        if(this.onJSON == false)
            this.resolve(s);
        return this;
    }

    /**
     * Useless for us.
     * @function redirect
     * @public
     * @param {String} dummy Input.
     */
    redirect(dummy: string) {
        this.resolve(dummy);
        return this;
    }

}