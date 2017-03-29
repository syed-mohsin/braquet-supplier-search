'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  Review = mongoose.model('Review'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, review, organization;

/**
 * Review routes tests
 */
describe('Review CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      email: 'blaise@braquet.com',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Blaise',
      lastName: 'Najafi',
      displayName: 'dnajafi',
      email: 'blaise@braquet.com',
      username: 'dnajafi',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    // Save a user to the test db and create new review
    user.save(function () {

      organization = new Organization({
        companyName: 'BOSS ORG',
        url: 'www.boss.com'
      });

      organization.save(function () {
        review = new Review({
          title: 'Review_2',
          rating: 2,
          content: 'Content for Review 2',
          category: 'Currently doing business with company',
          user: user,
          organization: organization
        });

        //user.find

        done();

      });
    });
  });

  // it('should be able to save an review if logged in', function (done) {
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       // Handle signin error
  //       if (signinErr) {
  //         return done(signinErr);
  //       }
        
  //       // Get the userId
  //       var userId = user.id;

  //       // Save a new review
  //       agent.post('/api/reviews')
  //         .send(review)
  //         .expect(200)
  //         .end(function (reviewSaveErr, reviewSaveRes) {
  //           // Handle review save error
  //           if (reviewSaveErr) {
  //             return done(reviewSaveErr);
  //           }

  //           // Get a list of reviews
  //           agent.get('/api/reviews')
  //             .end(function (reviewsGetErr, reviewsGetRes) {
  //               // Handle review save error
  //               if (reviewsGetErr) {
  //                 return done(reviewsGetErr);
  //               }

  //               // Get reviews list
  //               var reviews = reviewsGetRes.body;

  //               // Set assertions
  //               (reviews[0].user._id).should.equal(userId);
  //               (reviews[0].title).should.match('Review Title');

  //               // Call the assertion callback
  //               done();
  //             });
  //         });
  //     });
  // });


  afterEach(function (done) {
    User.remove().exec(function () {
      Review.remove().exec(done);
    });
  });
});
