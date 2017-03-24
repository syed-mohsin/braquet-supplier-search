'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Review = mongoose.model('Review'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a review
 */
exports.create = function (req, res) {
  if (!req.organization || !req.user) {
    return res.status(400).json({
      message: 'Invalid user or organization'
    });
  }

  var review = new Review(req.body);
  review.user = req.user._id;
  review.organization = req.organization._id;

  // review is unverified if not verified in at least one way
  if (req.user.emailVerified === false && req.user.verified === false) {
    review.verified = false;
  }

  // see if review already exists
  Review.findOne({
    user: req.user._id,
    organization: req.organization._id
  }, function(err, oldReview) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else if (oldReview) { // handle updating old review
      if (!req.body.content) { // make sure new message exists
        return res.status(400).send({
          message: 'Review description is required'
        });
      }

      review = oldReview;
      review.rating = req.body.rating;
      review.content = review.content + '\n\n***UPDATE ' + (new Date()).toDateString() + '***\n\n' + req.body.content;

      review.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.json(review);
        }
      });
    } else { // handle creating new review
      review.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          req.user.reviews.push(review);
          req.user.save(function(err) {
            if (err) {
              res.status(400).json({
                message: 'failed to save review to user'
              });
            } else {
              req.organization.reviews.push(review._id);
              req.organization.save(function(err) {
                if (err) {
                  res.status(400).json({
                    message: 'failed to save review to organization'
                  });
                } else {
                  res.json(review);
                }
              });
            }
          });
        }
      });
    }
  });
};

/**
 * Show the current review
 */
exports.read = function (req, res) {
  res.json(req.review);
};

/**
 * Update a review
 */
exports.update = function (req, res) {
  var review = req.review;

  review.title = req.body.title;
  review.content = req.body.content;
  review.anonymous = req.body.anonymous;

  review.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(review);
    }
  });
};

/**
 * Delete an review
 */
exports.delete = function (req, res) {
  var review = req.review;

  review.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(review);
    }
  });
};

/**
 * List of Reviews
 */
exports.list = function (req, res) {
  Review.find({ user: req.user._id })
  .sort('-created')
  .populate('user', 'displayName')
  .populate('organization', 'companyName logoImageUrl')
  .exec(function (err, reviews) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(reviews);
    }
  });
};

/**
 * Admin List of All Reviews
 */
exports.admin_list = function (req, res) {
  Review.find({})
  .sort('-created')
  .populate('user')
  .populate('organization')
  .exec()
  .then(function(reviews) {
    res.json(reviews);
  })
  .catch(function(err) {
    res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Review middleware
 */
exports.reviewByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Review is invalid'
    });
  }

  Review.findById(id)
  .populate('user', 'displayName')
  .populate('organization', 'companyName logoImageUrl')
  .exec(function (err, review) {
    if (err) {
      return next(err);
    } else if (!review) {
      return res.status(404).send({
        message: 'No review with that identifier has been found'
      });
    }
    req.review = review;
    next();
  });
};
