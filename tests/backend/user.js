/**
 * User routes module test.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi/user');
var fk = require('./FakeRes');
var db;

chai.use(require('chai-as-promised'));

/**
 * Runs all tests for the module.
 * @function test
 * @public
 */
exports.test = function() {
    before(function() {
        db = mc('localhost:27017/whigi');
    });
    after(function() {
        db.close();
    });

    describe('user module', function() {

        beforeEach(function() {
            db.collection('users').drop();
            db.collection('datas').drop();
            db.collection('vaults').drop();
        });

        describe('#getUser()', function() {
            db.collection('users').insert({
                _id: 'fsdfhp',
                username: 'Test'
            });

            it('should find a present user', function () {
                var f = fk.FakeRes();
                me.getUser({
                    
                }, fk);
                f.pr.should.eventually.equal(200);
            });
        });

    });
}