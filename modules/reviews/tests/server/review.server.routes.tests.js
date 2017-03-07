'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Review = mongoose.model('Review'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, review;

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
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new review
    user.save(function () {
      review = {
        title: 'Review Title',
        content: 'Review Content'
      };

      done();
    });
  });

  it('should be able to save an review if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new review
        agent.post('/api/reviews')
          .send(review)
          .expect(200)
          .end(function (reviewSaveErr, reviewSaveRes) {
            // Handle review save error
            if (reviewSaveErr) {
              return done(reviewSaveErr);
            }

            // Get a list of reviews
            agent.get('/api/reviews')
              .end(function (reviewsGetErr, reviewsGetRes) {
                // Handle review save error
                if (reviewsGetErr) {
                  return done(reviewsGetErr);
                }

                // Get reviews list
                var reviews = reviewsGetRes.body;

                // Set assertions
                (reviews[0].user._id).should.equal(userId);
                (reviews[0].title).should.match('Review Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an review if not logged in', function (done) {
    agent.post('/api/reviews')
      .send(review)
      .expect(403)
      .end(function (reviewSaveErr, reviewSaveRes) {
        // Call the assertion callback
        done(reviewSaveErr);
      });
  });

  it('should not be able to save an review if no title is provided', function (done) {
    // Invalidate title field
    review.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new review
        agent.post('/api/reviews')
          .send(review)
          .expect(400)
          .end(function (reviewSaveErr, reviewSaveRes) {
            // Set message assertion
            (reviewSaveRes.body.message).should.match('Title cannot be blank');

            // Handle review save error
            done(reviewSaveErr);
          });
      });
  });

  it('should be able to update an review if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new review
        agent.post('/api/reviews')
          .send(review)
          .expect(200)
          .end(function (reviewSaveErr, reviewSaveRes) {
            // Handle review save error
            if (reviewSaveErr) {
              return done(reviewSaveErr);
            }

            // Update review title
            review.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing review
            agent.put('/api/reviews/' + reviewSaveRes.body._id)
              .send(review)
              .expect(200)
              .end(function (reviewUpdateErr, reviewUpdateRes) {
                // Handle review update error
                if (reviewUpdateErr) {
                  return done(reviewUpdateErr);
                }

                // Set assertions
                (reviewUpdateRes.body._id).should.equal(reviewSaveRes.body._id);
                (reviewUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of reviews if not signed in', function (done) {
    // Create new review model instance
    var reviewObj = new Review(review);

    // Save the review
    reviewObj.save(function () {
      // Request reviews
      request(app).get('/api/reviews')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single review if not signed in', function (done) {
    // Create new review model instance
    var reviewObj = new Review(review);

    // Save the review
    reviewObj.save(function () {
      request(app).get('/api/reviews/' + reviewObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', review.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single review with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/reviews/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Review is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single review which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent review
    request(app).get('/api/reviews/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No review with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an review if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new review
        agent.post('/api/reviews')
          .send(review)
          .expect(200)
          .end(function (reviewSaveErr, reviewSaveRes) {
            // Handle review save error
            if (reviewSaveErr) {
              return done(reviewSaveErr);
            }

            // Delete an existing review
            agent.delete('/api/reviews/' + reviewSaveRes.body._id)
              .send(review)
              .expect(200)
              .end(function (reviewDeleteErr, reviewDeleteRes) {
                // Handle review error error
                if (reviewDeleteErr) {
                  return done(reviewDeleteErr);
                }

                // Set assertions
                (reviewDeleteRes.body._id).should.equal(reviewSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an review if not signed in', function (done) {
    // Set review user
    review.user = user;

    // Create new review model instance
    var reviewObj = new Review(review);

    // Save the review
    reviewObj.save(function () {
      // Try deleting review
      request(app).delete('/api/reviews/' + reviewObj._id)
        .expect(403)
        .end(function (reviewDeleteErr, reviewDeleteRes) {
          // Set message assertion
          (reviewDeleteRes.body.message).should.match('User is not authorized');

          // Handle review error error
          done(reviewDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Review.remove().exec(done);
    });
  });
});
