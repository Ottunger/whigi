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
        key: 'totallysecret',
        is_activated: true,
        data: {
            IIS: {id: 'fsdn', length: 8, shared_to: {}}
        }
    }
    var ds = new datasources.Datasource(db);
    me.managerInit(ds);

    describe('user module', function() {

        beforeEach(function(done) {
            db.collection('users').drop().then(function() {
                db.collection('datas').drop().then(function() {
                    db.collection('vaults').drop().then(function() {
                        db.collection('users').insert(dummy_user).then(function() {
                            done();
                        });
                    });
                });
            });
        });

        describe('#getUser()', function() {
            it('should find a present user', function(done) {
                var f = new fk.FakeRes(true);
                me.getUser({
                    user: {is_activated: true},
                    params: {id: dummy_user._id}
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
                    user: new user.User(dummy_user, ds)
                }, f);
                chai.expect(f.promise).to.eventually.become({
                    data: {
                        IIS: {id: 'fsdn', length: 8, shared_to: {}}
                    },
                    shared_with_me: {}
                }).notify(done);
            });
        });

        describe('#recData()', function() {
            it('should record my data', function(done) {
                var f = new fk.FakeRes(true);
                me.recData({
                    user: new user.User(dummy_user, ds),
                    body: {encr_data: 'bonjour', name: 'donnee'}
                }, f);
                f.promise.then(function(rec) {
                    chai.expect(db.collection('datas').findOne({_id: rec._id})).to.eventually.become({
                        _id: rec._id,
                        encr_data: 'bonjour'
                    }).notify(done);
                }, function(e) {
                    done(e);
                });
            });
        });

        describe('#updateUser()', function() {
            it('should update password and encr_master_key', function(done) {
                var f = new fk.FakeRes(false);
                me.updateUser({
                    user: new user.User(dummy_user, ds),
                    body: {password: 'hi', encr_master_key: 'lol'}
                }, f);
                f.promise.then(function() {
                    chai.expect(db.collection('users').findOne({_id: dummy_user._id}, {password: true, encr_master_key: true})).to.eventually.become({
                        _id: dummy_user._id,
                        password: '265f8fd0ec4892562b48d663307d67f8dc7f74eb67a2ee6dc3fd2ad483940ed3',
                        encr_master_key: 'lol'
                    }).notify(done);
                }, function(e) {
                    done(e);
                });
            });
        });

        describe('#regUser()', function() {
            it('should fail because of captcha', function(done) {
                var f = new fk.FakeRes(false);
                me.regUser({
                    get: function() {return 'fr'},
                    query: {captcha: 'dummy'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(400).notify(done);
            });
        });

        describe('#activateUser()', function() {
            it('should allow to reactivate a user', function(done) {
                var f = new fk.FakeRes(false);
                me.activateUser({
                    params: {key: dummy_user.key, id: dummy_user._id}
                }, f);
                chai.expect(f.promise).to.eventually.equal('/').notify(done);
            });
        });

        describe('#deactivateUser()', function() {
            it('should update password and encr_master_key', function(done) {
                var f = new fk.FakeRes(false);
                me.deactivateUser({
                    user: new user.User(dummy_user, ds)
                }, f);
                f.promise.then(function() {
                    chai.expect(db.collection('users').findOne({_id: dummy_user._id}, {is_activated: true})).to.eventually.become({
                        _id: dummy_user._id,
                        is_activated: false
                    }).notify(done);
                }, function(e) {
                    done(e);
                });
            });
        });

    });
}