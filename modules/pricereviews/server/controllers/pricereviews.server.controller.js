'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  PriceReview = mongoose.model('PriceReview'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a price review
 */
exports.create = function(req, res) {
  if (!req.organization || !req.user) {
    return res.status(400).json({
      message: 'Invalid user or organization'
    });
  }

  var priceReview = new PriceReview(req.body);
  priceReview.user = req.user._id;
  priceReview.organization = req.organization._id;

  // if (!req.user.emailVerified && !req.user.verified) {
  //   priceReview.verified = false;
  // }

  // save new price review
  priceReview.save()
  .then(function(savedPriceReview) {
    req.organization.priceReviews.push(priceReview._id);
    return req.organization.save();
  })
  .then(function(savedOrg) {
    res.json(priceReview);
  })
  .catch(function(err) {
    res.status(400).json({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Read a price review
 */
exports.read = function(req, res) {
  res.json(req.priceReview);
};

/**
 * Update a price review
 */
exports.update = function (req, res) {
  var priceReview = req.priceReview;

  priceReview.price = req.body.price;
  priceReview.quantity = req.body.quantity;
  priceReview.panelType = req.body.panelType;
  priceReview.shippingLocation = req.body.shippingLocation;

  priceReview.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(priceReview);
    }
  });
};

/**
 * Delete a price review
 */
exports.delete = function (req, res) {
  var priceReview = req.priceReview;

  priceReview.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(priceReview);
    }
  });
};

/**
 * List of Price Reviews
 */
exports.list = function (req, res) {
  PriceReview.find({ user: req.user._id })
  .sort('-created')
  .populate('user', 'displayName')
  .populate('organization', 'companyName logoImageUrl')
  .exec(function (err, priceReviews) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(priceReviews);
    }
  });
};

/**
 * Admin List of All Price Reviews
 */
exports.admin_list = function (req, res) {
  PriceReview.find({})
  .sort('-created')
  .populate('user')
  .populate('organization')
  .exec()
  .then(function(priceReviews) {
    res.json(priceReviews);
  })
  .catch(function(err) {
    res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Price Review fields for catalog
 */
exports.getFilters = function(req, res) {
  var filters = {};

  PriceReview.distinct('quantity').exec()
  .then(function(quantities) {
    filters.quantities = quantities;
    res.json(filters);
  })
  .catch(function(err) {
    res.status(400).json(err);
  });
};

/**
 * Price Review middleware
 */
exports.priceReviewByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Price Review is invalid'
    });
  }

  PriceReview.findById(id)
  .populate('user', 'displayName')
  .populate('organization', 'companyName logoImageUrl')
  .exec(function (err, priceReview) {
    if (err) {
      return next(err);
    } else if (!priceReview) {
      return res.status(404).send({
        message: 'No price review with that identifier has been found'
      });
    }
    req.priceReview = priceReview;
    next();
  });
};
