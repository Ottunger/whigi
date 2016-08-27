/**
 * Class for downloading information from another Whigi.
 * @module Downloader
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var querystring = require('querystring');
var https = require('https');

export class Downloader {

    /**
     * Creates an downloader.
     * @function constructor
     * @public
     */
    constructor(private full: number, private partial: number, conn: any, coll: string[]) {

    }

    /**
     * Tries to fetch an item.
     * @function fetch
     * @public
     * @param {String} id Id.
     * @param {String} name collection name.
     * @return {Promise} Result.
     */
    fetch(id: string, name: string): Promise {
        
    }

}
