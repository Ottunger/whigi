/**
 * API dealing with data retrieval and possible modification.
 * @module datafragment
 * @author Mathonet Grégoire
 */
'use strict';
var utils = require('../utils/utils');
var db;
/**
 * Set up.
 * @function managerInit
 * @public
 */
function managerInit(dbg) {
    db = dbg;
}
exports.managerInit = managerInit;
/**
 * Forges the response to retrieve a new info.
 * @function getData
 * @public
 * @TODO Check if must check ownership before sending.
 * @param {Request} req The request.
 * @param {Response} res The response.
 */
function getData(req, res) {
    db.retrieveData(req.params.id).then(function (df) {
        console.log(df);
        if (df === undefined || df === null) {
            res.type('application/json').status(404).json({ error: utils.i18n('client.noData', req) });
        }
        else {
            res.type('application/json').status(200).json(df.sanitarize());
        }
    }, function (e) {
        res.type('application/json').status(500).json({ error: utils.i18n('internal.db', req) });
    });
}
exports.getData = getData;
