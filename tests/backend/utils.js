/**
 * Utils module test.
 * @module utils
 * @author Mathonet Grégoire
 */

'use strict';
var expect = require('chai').expect;
var me = require('../../utils/utils');

/**
 * Runs all tests for the module.
 * @function test
 * @public
 */
exports.test = function() {
    describe('Utils module', function() {
    
        describe('#generateRandomString()', function() {
            it('should generate a 30-length string', function() {
                var str = me.generateRandomString(30);
                expect(str).to.have.length(30);
            });
            it('should be somewhat random', function() {
                var str = me.generateRandomString(6);
                var str2 = me.generateRandomString(6);
                expect(str).not.to.equal(str2);
            });
        });
        
    });
}