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
var fupt = require('../../common/cdnize/full-update_pb');
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
        data: {
            IIS: {id: 'fsdn', length: 8, shared_to: {somebody: 'avault'}}
        },
        encr_master_key: [239, 123, 142, 200, 135, 148, 97, 195, 15, 136, 33, 213, 99, 247, 45, 48, 254, 68, 67, 217, 90, 3, 20, 67, 122, 205, 43, 212, 97, 213, 141, 220],
        rsa_pub_key: '-----BEGIN PUBLIC KEY-----' +
            'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN' +
            'FOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76' +
            'xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4' +
            'gwQco1KRMDSmXSMkDwIDAQAB' +
            '-----END PUBLIC KEY-----',
        rsa_pri_key: [162,20,73,126,186,148,221,108,127,171,194,58,61,141,66,33]
    }
    var dummy_user2 = {
        _id: 'smthg',
        email: 'likeicare@test.com',
        shared_with_me: {}
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
        last_access: 1000,
        expire_epoch: 0
    }
    var dummy_vault2 = {
        _id: 'avault2',
        sharer_id: 'somethingother',
        shared_to_id: 'somebody',
        data_crypted_aes: 'data',
        aes_crypted_shared_pub: 'aes',
        data_name: 'IIS',
        last_access: 1000,
        expire_epoch: 0
    }
    var ds = new datasources.Datasource(db);
    me.managerInit(ds);

    describe('data module', function() {

        beforeEach(function(done) {
            db.collection('users').drop().then(function() {
                db.collection('datas').drop().then(function() {
                    db.collection('vaults').drop().then(function() {
                        db.collection('users').insert(dummy_user).then(function() {
                            db.collection('users').insert(dummy_user2).then(function() {
                                db.collection('datas').insert(dummy_data).then(function() {
                                    db.collection('vaults').insert([dummy_vault, dummy_vault2]).then(function() {
                                        done();
                                    });
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

        describe('#removeData()', function() {
            it('should accept silently a non present data', function(done) {
                var f = new fk.FakeRes(false);
                me.removeData({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'anything'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(200).notify(done);
            });
            it('should indeed remove a present one', function(done) {
                var f = new fk.FakeRes(false);
                me.removeData({
                    user: new user.User(dummy_user, ds),
                    params: {data_name: 'IIS'}
                }, f);
                f.promise.then(function() {
                    chai.expect(db.collection('users').findOne({_id: dummy_user._id}, {data: true})).to.eventually.become({
                        _id: dummy_user._id,
                         data: {}
                    }).notify(done);
                }, function(e) {
                    done(e);
                });
            });
        });

        describe('#regVault()', function() {
            it('should record a valid vault', function(done) {
                var f = new fk.FakeRes(false);
                me.regVault({
                    user: new user.User(dummy_user, ds),
                    body: {data_name: 'IIS', shared_to_id: dummy_user2._id, aes_crypted_shared_pub: 'aes', data_crypted_aes: 'data'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(201).notify(done);
                /*
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
                */
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
                    params: {vault_id: dummy_vault._id}
                }, f);
                f.promise.then(function(rec) {
                    chai.expect(db.collection('users').findOne({_id: dummy_user._id})).to.eventually.include.keys('data').notify(done);
                }, function(e) {
                    done(e);
                });
            });
            it('should not remove a vault that does not belong to user', function(done) {
                var f = new fk.FakeRes(false);
                me.removeVault({
                    user: new user.User(dummy_user, ds),
                    params: {vault_id: dummy_vault2._id}
                }, f);
                chai.expect(f.promise).to.eventually.equal(403).notify(done);
            });
        });

        describe('#getVault()', function() {
            it('should allow reading a good vault', function(done) {
                var f = new fk.FakeRes(false);
                me.getVault({
                    user: {_id: 'somebody'},
                    params: {vault_id: dummy_vault._id}
                }, f);
                chai.expect(f.promise).to.eventually.equal(200).notify(done);
            });
            it('should not allow reading as creator', function(done) {
                var f = new fk.FakeRes(false);
                me.getVault({
                    user: {_id: dummy_user._id},
                    params: {vault_id: dummy_vault._id}
                }, f);
                chai.expect(f.promise).to.eventually.equal(403).notify(done);
            });
            it('should not allow reading someone else\'s vault', function(done) {
                var f = new fk.FakeRes(false);
                me.getVault({
                    user: {_id: dummy_user._id},
                    params: {vault_id: dummy_vault2._id}
                }, f);
                chai.expect(f.promise).to.eventually.equal(403).notify(done);
            });
        });

        describe('#accessVault()', function() {
            it('should find a valid vault with good date', function(done) {
                var f = new fk.FakeRes(true);
                me.accessVault({
                    user: new user.User(dummy_user, ds),
                    params: {vault_id: dummy_vault._id}
                }, f);
                chai.expect(f.promise).to.eventually.become({last_access: 1000, expire_epoch: 0}).notify(done);
            });
            it('should not find a non-existent vault', function(done) {
                var f = new fk.FakeRes(false);
                me.accessVault({
                    user: new user.User(dummy_user, ds),
                    params: {vault_id: 'anotherguy'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

        describe('#getAny()', function() {
            it('should return any mapping for the good key', function(done) {
                var f = new fk.FakeRes(true);
                me.getAny({
                    params: {
                        key: require('../../common/key.json').key,
                        collection: 'users',
                        id: dummy_user._id
                    }
                }, f);
                chai.expect(f.promise).to.eventually.include.keys(['_id', 'is_company', 'company_info', 'rsa_pub_key']).notify(done);
            });
        });

        describe('#removeAny()', function() {
            it('should remove mappings for the good key', function(done) {
                var f = new fk.FakeRes(false);
                me.removeAny({
                    body: {
                        key: require('../../common/key.json').key,
                        payload: new fupt.FullUpdate().serializeBinary()
                    }
                }, f);
                chai.expect(f.promise).to.eventually.equal(200).notify(done);
            });
        });

    });
}