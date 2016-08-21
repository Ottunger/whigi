/**
 * API to have checks at upper layer.
 * @module checks
 * @author Mathonet Grégoire
 */

'use strict';
declare var require: any
var hash = require('js-sha256').sha256;
var utils = require('./utils');

/**
 * Verifies that the client has generated an OK solution. Anyways, generate a new challenge.
 * @function checkPuzzle
 * @public
 * @param {Request} req The request.
 * @param {Response} res The response.
 * @param {Function} next Handler middleware.
 */
export function checkPuzzle(req, res, next) {
    if(!('puzzle' in req.query)) {
        req.user.puzzle = utils.generateRandomString(16);
        req.user.persist();
        res.type('application/json').status(412).json({error: utils.i18n('client.puzzle', req), puzzle: req.user.puzzle});
    } else {
        var complete = hash.sha256(req.user.puzzle + req.query.puzzle);
        if(complete.charAt(0) == '0' && complete.charAt(1) == '0' && complete.charAt(2) == '0' && complete.charAt(3) == '0') {
            req.user.puzzle = utils.generateRandomString(16);
            req.user.persist();
            next();
        } else {
            req.user.puzzle = utils.generateRandomString(16);
            req.user.persist();
            res.type('application/json').status(412).json({error: utils.i18n('client.puzzle', req), puzzle: req.user.puzzle});
        }
    }
}

/**
 * Creates a function suitable for use in express app that checks that the request has some fields in it.
 * @function checkBody
 * @public
 * @param {Array} arr The required top-level fields.
 * @return {Function} An express middleware.
 */
export function checkBody(arr: string[]) {
    return function(req, res, next) {
        if(!req.body) {
            res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
        } else {
            for(var i = 0; i < arr.length; i++) {
                if(!(arr[i] in req.body)) {
                    res.type('application/json').status(400).json({error: utils.i18n('client.missing', req)});
                    return;
                }
            }
            next();
        }
    }
}