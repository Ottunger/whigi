/**
 * Data routes module test.
 * @module data
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi/data');
var user = require('../../common/models/User');
var vault = require('../../common/models/Vault');
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
            IIS: {id: 'fsdn', length: 8, shared_to: {somebody: 'avault'}}
        }
    }
    var dummy_data = {
        _id: 'fsdn',
        encr_data: 'dataIIS'
    }
    var dummy_vault = {
        _id: 'avault',
        sharer_id: 'fsdfhp',
        shared_to_id: 'somebody',
        data_crypted_aes: 'data',
        aes_crypted_shared_pub: 'aes',
        data_name: 'IIS',
        last_access: 1000
    }
    var ds = new datasources.Datasource(db);
    me.managerInit(ds);

    describe('data module', function() {

        beforeEach(function(done) {
            db.collection('users').drop().then(function() {
                db.collection('datas').drop().then(function() {
                    db.collection('vaults').drop().then(function() {
                        db.collection('users').insert(dummy_user).then(function() {
                            db.collection('datas').insert(dummy_data).then(function() {
                                db.collection('vaults').insert(dummy_vault).then(function() {
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        describe('#getData()', function() {
            it('should find a present data', function(done) {
                var f = new fk.FakeRes(false);
                me.getData({
                    params: {id: dummy_data._id}
                }, f);
                chai.expect(f.promise).to.eventually.equal(200).notify(done);
            });
            it('should not find a non-present data', function(done) {
                var f = new fk.FakeRes(false);
                me.getData({
                    params: {id: 'fake'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

        describe('#regVault()', function() {
            it('should record a valid vault', function(done) {
                var f = new fk.FakeRes(true);
                me.regVault({
                    user: new user.User(dummy_user, ds),
                    body: {data_name: 'IIS', shared_to_id: 'colleague', aes_crypted_shared_pub: 'aes', data_crypted_aes: 'data'}
                }, f);
                f.promise.then(function(rec) {
                    chai.expect(db.collection('vaults').findOne({_id: rec._id})).to.eventually.become({
                        _id: rec._id,
                        data_name: 'IIS',
                        shared_to_id: 'colleague',
                        aes_crypted_shared_pub: 'aes',
                        data_crypted_aes: 'data',
                        sharer_id: dummy_user._id,
                        last_access: 0
                    }).notify(done);
                }, function(e) {
                    done(e);
                });
            });
            it('should record a vault with code 201', function(done) {
                var f = new fk.FakeRes(false);
                me.regVault({
                    user: new user.User(dummy_user, ds),
                    body: {data_name: 'IIS', shared_to_id: 'colleague', aes_crypted_shared_pub: 'aes', data_crypted_aes: 'data'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(201).notify(done);
            });
            it('should not create for a non existent data name', function(done) {
                var f = new fk.FakeRes(false);
                me.regVault({
                    user: new user.User(dummy_user, ds),
                    body: {data_name: 'fake'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

        describe('#removeVault()', function() {
            it('should remove a valid vault', function(done) {
                var f = new fk.FakeRes(true);
                me.removeVault({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS', shared_to_id: 'somebody'}
                }, f);
                f.promise.then(function(rec) {
                    chai.expect(db.collection('users').findOne({_id: dummy_user._id})).to.eventually.include.keys('data').notify(done);
                }, function(e) {
                    done(e);
                });
            });
            it('should fail nicely for shared_to_id', function(done) {
                var f = new fk.FakeRes(false);
                me.removeVault({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS', shared_to_id: 'anotherguy'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(200).notify(done);
            });
        });

        describe('#getVault()', function() {
            it('should find a valid vault', function(done) {
                var f = new fk.FakeRes(true);
                me.getVault({
                    user: {_id: 'somebody'},
                    params: {data_name: 'IIS', sharer_id: dummy_user._id}
                }, f);
                chai.expect(f.promise).to.eventually.include.keys(['aes_crypted_shared_pub', 'data_crypted_aes']).notify(done);
            });
            it('should not find a non-valid vault', function(done) {
                var f = new fk.FakeRes(false);
                me.getVault({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS', sharer_id: 'anotherguy'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

        describe('#accessVault()', function() {
            it('should find a valid vault with good date', function(done) {
                var f = new fk.FakeRes(true);
                me.accessVault({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS', shared_to_id: 'somebody'}
                }, f);
                chai.expect(f.promise).to.eventually.become({last_access: 1000}).notify(done);
            });
            it('should not find a non-valid vault', function(done) {
                var f = new fk.FakeRes(false);
                me.accessVault({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS', shared_to_id: 'anotherguy'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
            it('should not find a non-valid vault', function(done) {
                var f = new fk.FakeRes(false);
                me.accessVault({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS2', shared_to_id: 'somebody'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

    });
}