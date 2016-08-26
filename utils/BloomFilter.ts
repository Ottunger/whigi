/**
 * Class for generating sets that discriminate in non appartenance.
 * @module Uploader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256');

export class BloomFilter {

    private k: number;
    private arr: Uint8Array;

    /**
     * Creates an BloomFilter.
     * @function constructor
     * @public
     * @param {Number} m Number of bits in filter.
     * @param {Number} n Expected number of elements at most.
     */
    constructor(private m: number, private n: number) {
        try {
            this.arr = new Uint8Array(m / 8);
        } catch(e) {
            m = 8 * 1024;
            this.arr = new Uint8Array(1024);
        }
        this.k = 0.69314718056*(m / n);
    }

    /**
     * Hash a string.
     * @function hashCode
     * @private
     * @param {String} str String.
     * @return {Number} Hash.
     */
    private hashCode(str: string): number {
        var hash = 0, i, chr, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    };

    /**
     * Add to the set a new element.
     * @function add
     * @public
     * @param {String} el Element.
     */
    add(el: string) {
        for(var i = 0; i < this.k; i++) {
            var hash = hash.sha256(el + i);
            var code = this.hashCode(hash);
            this.arr[code / 8] |= (1 >> (code % 8));
        }
    }

    /**
     * Check if contains an element.
     * @function contains
     * @public
     * @param {String} el Element.
     * @return {Boolean} Answer.
     */
    contains(el: string): boolean {
        for(var i = 0; i < this.k; i++) {
            var hash = hash.sha256(el + i);
            var code = this.hashCode(hash);
            if((this.arr[code / 8] && (1 >> (code % 8))) == 0)
                return false;
        }
        return true;
    }

}
