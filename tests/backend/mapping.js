/**
 * Mappings for password recovery module test.
 * @module mapping
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi-restore/mapping');
var vault = require('../../common/models/Mapping');
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
    var dummy_mapping = {
        _id: 'amapping',
        email: 'test@envict.com',
        master_key: 'evenmoresecret',
        pwd_key: 'keepsecret!',
        time_changed: 0
    }
    me.managerInit(db);

    describe('mapping module', function() {

        beforeEach(function(done) {
            db.collection('mappings').drop().then(function() {
                db.collection('mappings').insert(dummy_mapping).then(function() {
                    done();
                });
            });
        });

        describe('#newMapping()', function() {
            it('should record a mapping from Whigi', function(done) {
                var f = new fk.FakeRes(true);
                me.newMapping({
                    body: {
                        email: 'test2@envict.com',
                        master_key: 'iknowit',
                        key: require('../../common/key.json').key
                    },
                    get: function() {return 'fr'}
                }, f);
                f.promise.then(function(rec) {
                    chai.expect(db.collection('mappings').findOne({_id: rec._id})).to.eventually.include.keys(['email', 'master_key']).notify(done);
                }, function(e) {
                    done(e);
                });
            });
            it('should decline a mapping not from Whigi', function(done) {
                var f = new fk.FakeRes(false);
                me.newMapping({
                    body: {
                        email: 'test2@envict.com',
                        master_key: 'iknowit',
                        key: 'evil'
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(401).notify(done);
            });
        });

        describe('#requestMapping()', function() {
            it('should declnine creation because unable to reach other API', function(done) {
                var f = new fk.FakeRes(false);
                me.requestMapping({
                    params: {
                        email: 'test@envict.com',
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(500).notify(done);
            });
            it('should decline a unrecognized one', function(done) {
                var f = new fk.FakeRes(false);
                me.requestMapping({
                    params: {
                        email: 'evil@envict.com',
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

        describe('#retrieveMapping()', function() {
            it('should fail because of key expiration', function(done) {
                var f = new fk.FakeRes(false);
                me.retrieveMapping({
                    params: {
                        token: 'keepsecret!',
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(412).notify(done);
            });
            it('should decline a unrecognized one', function(done) {
                var f = new fk.FakeRes(false);
                me.retrieveMapping({
                    params: {
                        token: 'dunno',
                    },
                    get: function() {return 'fr'}
                }, f);
                chai.expect(f.promise).to.eventually.equal(404).notify(done);
            });
        });

    });
}