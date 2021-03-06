/**
 * User routes module test.
 * @module user
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('mongodb').MongoClient;
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
    mc.connect('mongodb://localhost:27017/whigi', function(err, db) {
        if(!err) {
            var dummy_user = {
                _id: 'fsdfhp',
                data: {
                    IIS: {id: 'fsdn', length: 8, shared_to: {}}
                },
                encr_master_key: [239, 123, 142, 200, 135, 148, 97, 195, 15, 136, 33, 213, 99, 247, 45, 48, 254, 68, 67, 217, 90, 3, 20, 67, 122, 205, 43, 212, 97, 213, 141, 220],
                rsa_pub_key: '-----BEGIN PUBLIC KEY-----' +
                    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN' +
                    'FOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76' +
                    'xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4' +
                    'gwQco1KRMDSmXSMkDwIDAQAB' +
                    '-----END PUBLIC KEY-----',
                rsa_pri_key: [[162,20,73,126,186,148,221,108,127,171,194,58,61,141,66,33]],
                is_company: 0,
                company_info: {}
            }
            var dummy_token0 = {
                _id: 'dummy0',
                bearer_id: dummy_user._id
            }
            var dummy_token1 = {
                _id: 'dummy1',
                bearer_id: dummy_user._id
            }
            var ds = new datasources.Datasource(db);
            me.managerInit(ds);

            describe('user module', function() {

                beforeEach(function(done) {
                    db.collection('users').drop(function() {
                        db.collection('datas').drop(function() {
                            db.collection('vaults').drop(function() {
                                db.collection('tokens').drop(function() {
                                    db.collection('users').insert(dummy_user, function() {
                                        db.collection('tokens').insert([dummy_token0, dummy_token1], function() {
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                describe('#peekUser()', function() {
                    it('should find a present user', function(done) {
                        var f = new fk.FakeRes(false);
                        me.peekUser({
                            params: {id: dummy_user._id}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(200).notify(done);
                    });
                    it('should not find a non-present user', function(done) {
                        var f = new fk.FakeRes(false);
                        me.peekUser({
                            params: {id: 'dummy'}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(404).notify(done);
                    });
                });

                describe('#getUser()', function() {
                    it('should find a present user', function(done) {
                        var f = new fk.FakeRes(false);
                        me.getUser({
                            params: {id: dummy_user._id}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(200).notify(done);
                    });
                    it('should not find a non-present user', function(done) {
                        var f = new fk.FakeRes(false);
                        me.getUser({
                            params: {id: 'dummy'}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(404).notify(done);
                    });
                });

                describe('#getProfile()', function() {
                    it('should allow a logged in user', function(done) {
                        var f = new fk.FakeRes(false);
                        me.getProfile({
                            user: new user.User(dummy_user, ds)
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(200).notify(done);
                    });
                });

                describe('#closeTo()', function() {
                    it('should not allow closing to unknown', function(done) {
                        var f = new fk.FakeRes(false);
                        me.closeTo({
                            params: {id: 'wtf'},
                            user: new user.User(dummy_user, ds),
                            body: {new_keys: [[1]]}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(404).notify(done);
                    });
                    it('should not allow closing to self', function(done) {
                        var f = new fk.FakeRes(false);
                        me.closeTo({
                            params: {id: dummy_user._id},
                            user: new user.User(dummy_user, ds),
                            body: {new_keys: [[1]]},
                            get: function() {return 'fr'}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(403).notify(done);
                    });
                });

                describe('#goCompany1()', function() {
                    it('should allow changing info up to one max', function(done) {
                        var f = new fk.FakeRes(false);
                        me.goCompany1({
                            user: new user.User(dummy_user, ds),
                            body: {name: 'Hi'}
                        }, f);
                        f.promise.then(function() {
                            db.collection('users').findOne({_id: dummy_user._id}, {is_company: true}, function(err, got) {
                                chai.expect(got).to.be({
                                    _id: dummy_user._id,
                                    is_company: 1
                                });
                                done();
                            });
                        }, function(e) {
                            done(e);
                        });
                    });
                });

                describe('#goCompany9()', function() {
                    it('should allow changing info up to max level', function(done) {
                        var f = new fk.FakeRes(false);
                        me.goCompany9({
                            user: {name: 'Bonjour'},
                            query: {req: 'will fail'},
                            get: function() {return 'fr'}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(403).notify(done);
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
                            body: {encr_data: 'bonjour', name: 'donnee', version: 0}
                        }, f);
                        f.promise.then(function(rec) {
                            db.collection('datas').findOne({_id: rec._id}, function(err, got) {
                                chai.expect(got).to.be({
                                    _id: rec._id,
                                    encr_data: 'bonjour',
                                    version: 0,
                                    encr_aes: null
                                });
                                done();
                            });
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
                            body: {new_password: 'abcdefgh', encr_master_key: 'lol', sha_master: 'lol2'}
                        }, f);
                        f.promise.then(function() {
                            db.collection('users').findOne({_id: dummy_user._id}, {encr_master_key: true, sha_master: true}, function(err, got) {
                                chai.expect(got).to.be({
                                    _id: dummy_user._id,
                                    encr_master_key: 'lol',
                                    sha_master: 'lol2'
                                });
                                done();
                            });
                        }, function(e) {
                            done(e);
                        });
                    });
                });

                describe('#regUser()', function() {
                    it('should record a user', function(done) {
                        var f = new fk.FakeRes(false);
                        me.regUser({
                            get: function() {return 'fr'},
                            query: {captcha: 'dummy'},
                            body: {password: 'abcdefgh', username: 'lol'}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(201).notify(done);
                    });
                });

                describe('#newToken()', function() {
                    it('should accept the creation', function(done) {
                        var f = new fk.FakeRes(false);
                        me.newToken({
                            user: new user.User(dummy_user, ds),
                            body: {is_eternal: false}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(201).notify(done);
                    });
                });

                describe('#removeToken()', function() {
                    it('should remove all tokens', function(done) {
                        var f = new fk.FakeRes(true);
                        me.removeToken({
                            user: new user.User(dummy_user, ds)
                        }, f);
                        f.promise.then(function() {
                            db.collection('tokens').findOne({bearer_id: dummy_user._id}, function(err, got) {
                                chai.expect(got).to.be(null);
                                done();
                            });
                        }, function(e) {
                            done(e);
                        });
                    });
                });

                describe('#restoreToken()', function() {
                    it('should create a token for the good key', function(done) {
                        var f = new fk.FakeRes(true);
                        me.restoreToken({
                            user: {
                                _id: 'whigi-wissl'
                            },
                            body: {
                                token_id: 'a',
                                bearer_id: 'testeuh'
                            }
                        }, f);
                        f.promise.then(function() {
                            db.collection('tokens').findOne({bearer_id: 'testeuh'}, function(err, got) {
                                chai.expect(got).to.include.keys(['_id', 'bearer_id']);
                                done();
                            });
                        }, function(e) {
                            done(e);
                        });
                    });
                });

                describe('#createOAuth()', function() {
                    it('should not create a token as no internet to example.com', function(done) {
                        var f = new fk.FakeRes(false);
                        me.createOAuth({
                            user: new user.User(dummy_user, ds),
                            body: {
                                for_id: 'nothing',
                                prefix: ''
                            },
                            get: function() {return 'fr';}
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(403).notify(done);
                    });
                });

                describe('#removeOAuth()', function() {
                    it('should not remove a non existent token but fail nicely', function(done) {
                        var f = new fk.FakeRes(false);
                        me.removeOAuth({
                            user: new user.User(dummy_user, ds),
                            params: {
                                id: 'haha'
                            }
                        }, f);
                        chai.expect(f.promise).to.eventually.equal(200).notify(done);
                    });
                });

            });
        }
    });
}