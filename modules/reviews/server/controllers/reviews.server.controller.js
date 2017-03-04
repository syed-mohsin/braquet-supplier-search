'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Review = mongoose.model('Review'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a review
 */
exports.create = function (req, res) {
  var review = new Review(req.body);
  review.user = req.user;

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
  Review.find().sort('-created').populate('user', 'displayName').exec(function (err, reviews) {
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
 * Review middleware
 */
exports.reviewByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Review is invalid'
    });
  }

  Review.findById(id).populate('user', 'displayName').exec(function (err, review) {
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
