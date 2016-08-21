/**
 * User routes module test.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi/user');
var user = require('../../common/models/User');
var datasources = require('../../common/Datasource');
var fk = require('./FakeRes');
var db;

chai.use(require('chai-as-promised'));

/**
 * Runs all tests for the module.
 * @function test
 * @public
 */
exports.test = function() {
    var db = mc('localhost:27017/whigi');
    var dummy_user = {
        _id: 'fsdfhp',
        username: 'Test',
        is_activated: true,
        data: {
            IIS: {id: 'fsdn', length: 8, shared_to: {}}
        }
    }
    var ds = new datasources.Datasource(db);
    me.managerInit(ds);

    describe('user module', function() {

        beforeEach(function(done) {
            db.collection('users').drop();
            db.collection('datas').drop();
            db.collection('vaults').drop();
            db.collection('users').insert(dummy_user).then(function() {
                done();
            });
        });

        describe('#getUser()', function() {
            it('should find a present user', function(done) {
                var f = new fk.FakeRes(true);
                me.getUser({
                    user: {is_activated: true},
                    params: {id: 'fsdfhp'}
                }, f);
                chai.expect(f.promise).to.eventually.include.keys('_id').notify(done);
            });
            it('should not find a non-present user', function(done) {
                var f = new fk.FakeRes(false);
                me.getUser({
                    user: {is_activated: true},
                    params: {id: 'dummy'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

        describe('#listData()', function() {
            it('should find the length of a data known', function(done) {
                var f = new fk.FakeRes(true);
                me.listData({
                    user: new user.User(dummy_user, ds),
                    params: {id: 'fsdfhp'}
                }, f);
                chai.expect(f.promise).to.eventually.become({
                    data: {
                        IIS: {id: 'fsdn', length: 8, shared_to: {}}
                    },
                    shared_with_me: {}
                }).notify(done);
            });
        });

    });
}