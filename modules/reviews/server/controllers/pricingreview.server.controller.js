'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  PricingReview = mongoose.model('Review'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a pricing review
 */
exports.create = function(req, res) {
  if (!req.organization || !req.user) {
    return res.status(400).json({
      message: 'Invalid user or organization'
    });
  }

  var pricingReview = new PricingReview(req.body);

  PricingReview.findOne({
    user: req.user._id,
    organization: req.organization._id
  }, function(err, existingPricingReview) {
    if (existingPricingReview) {
      res.status(400).json({
        message: 'You have already submitted a quote for this company'
      });
    } else {
      // save new pricing review
      pricingReview.save()
      .then(function(savedPricingReview) {
        res.json(pricingReview);
      })
      .catch(function(err) {
        res.status(400).json(err);
      });
    }
  });
};

/**
 * Delete a pricing review
 */
exports.delete = function (req, res) {
  var pricingReview = req.pricingReview;

  pricingReview.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(pricingReview);
    }
  });
};

/**
 * Pricing Review middleware
 */
exports.pricingReviewByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Pricing Review is invalid'
    });
  }

  PricingReview.findById(id)
  .populate('user', 'displayName')
  .populate('organization', 'companyName logoImageUrl')
  .exec(function (err, pricingReview) {
    if (err) {
      return next(err);
    } else if (!pricingReview) {
      return res.status(404).send({
        message: 'No pricing review with that identifier has been found'
      });
    }
    req.pricingReview = pricingReview;
    next();
  });
};
