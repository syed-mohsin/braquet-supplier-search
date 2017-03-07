'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Bid = mongoose.model('Bid'),
  Project = mongoose.model('Project'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a bid
 */
exports.create = function (req, res) {
  var bid = new Bid(req.body);
  bid.user = req.user;

  // add user organization to bid
  bid.organization = req.user.organization;

  // fetch project and
  // 1) verify project exists
  // 2) verify bid deadline has not passed
  Project.findById(bid.project, function(err, project) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else if (!project) {
      return res.status(400).send({
        message: 'Cannot post bid: not a valid project'
      });
    } else {
      // make time comparison
      if (bid.created > project.bid_deadline) {
        return res.status(400).send({
          message: 'Bid Deadline has passed'
        });
      }

      // Finally create the bid
      bid.save(function (err, savedBid) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else { // save new bid to project
          project.bids.push(savedBid);
          project.save(function(err) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              // notify project owner that bid was added
              var io = req.app.get('socketio');

              // send to all users currently viewing project
              io.emit('refreshProjectView', project._id);

              res.json(savedBid);
            }
          });
        }
      });
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
  Bid.find().sort('-created')
    .populate('user', 'displayName')
    .populate('organization')
    .populate('panel_models')
    .exec(function (err, bids) {
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
 * Delete a bid
 */
exports.delete = function (req, res) {
  var bid = req.bid;

  bid.remove(function (err) {
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
 * bid middleware
 */
exports.bidByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'bid is invalid'
    });
  }

  Bid.findById(id)
    .populate('user', 'displayName')
    .populate('project')
    .populate('panel_models')
    .populate('organization')
    .exec(function (err, bid) {
      if (err) {
        return next(err);
      } else if (!bid) {
        return res.status(404).send({
          message: 'No bid with that identifier has been found'
        });
      } else if (req.user.roles[0] === 'seller' && String(req.user._id) !== String(bid.user._id)) {
        return res.status(403).send({
          message: 'You are not authorized to access this page'
        });
      }

      req.bid = bid;
      next();
    });
};
