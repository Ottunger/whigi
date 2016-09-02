/**
 * Mappings for password recovery module test.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi-restore/mapping');
var fk = require('./FakeRes');
var db;

chai.use(require('chai-as-promised'));

/**
 * Runs all tests for the module.
 * @function test
 * @public
 */
exports.test = function() {
    var db = mc('localhost:27017/whigi-restore');
    me.managerInit(db);

    describe('mapping module', function() {

        describe('#requestMapping()', function() {
            it('should declnine creation because unable to reach other API', function(done) {
                var f = new fk.FakeRes(false);
                me.requestMapping({
                    params: {
                        id: 'myid',
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(600).notify(done);
            });
        });

        describe('#mixMapping()', function() {
            it('should declnine creation because unable to reach other API', function(done) {
                var f = new fk.FakeRes(false);
                me.mixMapping({
                    params: {
                        id: 'myid',
                        half: 'abcd'
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(600).notify(done);
            });
        });

    });
}