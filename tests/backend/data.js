/**
 * Data routes module test.
 * @module data
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi/data');
var data = require('../../common/models/Datafragment');
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
    var dummy_data = {
        _id: 'fsdn',
        encr_data: 'dataIIS'
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
                                done();
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

    });
}