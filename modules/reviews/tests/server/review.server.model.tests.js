'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  Review = mongoose.model('Review');

/**
 * Globals
 */
var user, review, organization;

/**
 * Unit tests
 */
describe('Review Model Unit Tests:', function () {
  beforeEach(function (done) {
    user = new User({
      firstName: 'Blaise',
      lastName: 'Najafi',
      displayName: 'Blaise Najafi',
      email: 'blaise@braquet.com',
      username: 'dnajafi',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    user.save(function () {
      organization = new Organization({
        companyName: 'BOSS ORG',
        url: 'www.boss.com'
      });

      organization.save(function () {
        review = new Review({
          title: 'Review_1',
          rating: 1,
          content: 'Content for Review 1',
          category: 'Currently doing business with company',
          user: user,
          organization: organization
        });

        done();

      });
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      review.save(function (err) {
        console.log('logging error:', err);
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without title', function (done) {
      review.title = '';
      review.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function (done) {
    Review.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
