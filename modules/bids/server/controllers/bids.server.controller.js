'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Bid = mongoose.model('Bid'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a bid
 */
exports.create = function (req, res) {
  var bid = new Bid(req.body);
  bid.user = req.user;

  bid.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(bid);
    }
  });
};

/**
 * Show the current bid
 */
exports.read = function (req, res) {
  res.json(req.bid);
};

/**
 * List of bids
 */
exports.list = function (req, res) {
  bid.find().sort('-created').populate('user', 'displayName').exec(function (err, bids) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(bids);
    }
  });
};

/**
 * bid middleware
 */
exports.bidByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'bid is invalid'
    });
  }

  Bid.findById(id).populate('user', 'displayName').exec(function (err, bid) {
    if (err) {
      return next(err);
    } else if (!bid) {
      return res.status(404).send({
        message: 'No bid with that identifier has been found'
      });
    }
    req.bid = bid;
    next();
  });
};
