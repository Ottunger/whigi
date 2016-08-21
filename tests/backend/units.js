/**
 * All modules unit tests.
 * @module units
 * @author Mathonet Grégoire
 */

'use strict';
var user = require('./user');
var data = require('./data');
var utils = require('./utils');

describe('Testing Whigi...', function() {
    user.test();
    data.test();
    utils.test();
});