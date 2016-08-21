/**
 * Data routes module test.
 * @module data
 * @author Mathonet Grégoire
 */

'use strict';
var chai = require('chai');
var mc = require('promised-mongo');
var me = require('../../whigi/data');
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
    db = mc('localhost:27017/whigi');
    me.managerInit(new datasources.Datasource(db));
    
    describe('data module', function() {

        beforeEach(function(done) {
            db.collection('users').drop();
            db.collection('datas').drop();
            db.collection('vaults').drop();
            db.collection('users').insert({
                _id: 'fsdfhp',
                username: 'Test',
                is_activated: true
            }).then(function() {
                done();
            });
        });

    });
}