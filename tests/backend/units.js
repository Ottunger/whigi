/**
 * All modules unit tests.
 * @module units
 * @author Mathonet Grégoire
 */

'use strict';
var user = require('./user');
var data = require('./data');
var utils = require('./utils');
var mapping = require('./mapping');

describe('Testing Whigi...', function() {
    user.test();
    data.test();
    utils.test();
});
describe('Testing Whigi-restore...', function() {
    mapping.test();
});