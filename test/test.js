'use strict';

var mongoose = require('mongoose');
var chai = require('chai');
var chaihttp = require('chai-http');
chai.use(chaihttp);
var expect = chai.expect;
var request = chai.request;

var Users = require(__dirname + '/../models/user_model.js');

process.env.MONGOLAB_URI = 'mongodb://localhost/test_db';

require(__dirname + '/../server.js');
require(__dirname + '/../routes/routes.js');

describe('test user REST api', function () {

  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      done();
    });
  });

  it('should be able to create a new user', function(done)  {
    request('localhost:3000')
      .post('/users')
      .send({name: 'James Dean'})
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.name).to.eql('James Dean');
        expect(res.body).to.have.property('_id');
        done();
      });
  });

  it('should get all users in the  db', function(done) {
    request('localhost:3000')
      .get('/users')
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(typeof res.body).to.eql('object');
        done();
      });
  });

  describe('tests need a user in the db to work with', function() {
    beforeEach(function(done) {
      var testUser = new Users({name: 'test user'});
      testUser.save(function(err, data) {
        if(err) throw err;
        this.testUser = data;
        done();
      }.bind(this));
    });

    it('should be able to make a user in a beforeEach block', function() {
      expect(this.testUser.name).to.eql('test user');
      expect(this.testUser).to.have.property('name');
    });

    it('should update a user page', function(done) {
      var id = this.testUser._id;
      request('localhost:3000')
      .put('/users/' + id)
      .send('{"name": "new user name"}')
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body).to.have.property('name');
        done();
      });
    });

    it('should be able to delete a user', function(done) {
      var id = this.testUser._id;
      request('localhost:3000')
        .delete('/users/' + id)
        .end(function(err, res) {
          expect(err).to.eql(null);
          expect(res.body).to.eql({message: 'user removed'});
          done();
        });
    });
  });
});
