/**
 * Class for simulating a response and monitor it
 * @module FakeRes
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any

export class FakeRes {

    public end: number;
    public pr: Promise;
    private resolve: Function;
    private reject: Function;

    /**
     * Creates a non determined FakeRes.
     * @function constructor
     * @public
     */
    constructor() {
        var self = this;

        this.end = 0;
        this.pr = new Promise(function(resolve, reject) {
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
    type(dummy: string) {}

    /**
     * Useless for us.
     * @function json
     * @public
     * @param {String} dummy Input.
     */
    json(dummy: string) {}

    /**
     * Saves the status.
     * @function status
     * @public
     * @param {Number} s Status.
     */
    status(s: number) {
        this.end = s;
        this.resolve(s);
    }

}