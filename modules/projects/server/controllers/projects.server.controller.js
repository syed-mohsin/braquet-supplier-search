'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  Bid = mongoose.model('Bid'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a project
 */
exports.create = function (req, res) {
  var project = new Project(req.body);
  project.user = req.user;

  project.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(project);
    }
  });
};

/**
 * Show the current project
 */
exports.read = function (req, res) {
  res.json(req.project);
};

/**
 * Update a project
 */
exports.update = function (req, res) {
  var project = req.project;

  project.title = req.body.title;
  project.system_capacity = req.body.system_capacity;
  project.bid_deadline = req.body.bid_deadline;
  project.shipping_address = req.body.shipping_address;
  project.panel_wattage = req.body.panel_wattage;
  project.panel_type = req.body.panel_type;

  project.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(project);
    }
  });
};

/**
 * Update a project with a bid
 */
exports.storeBid = function (req, res) {
  var project = req.project;
  var bid = req.bid;
  console.log(bid);
  project.bids.push(bid._id);

  project.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(project);
    }
  });
};

/**
 * Delete an project
 */
exports.delete = function (req, res) {
  var project = req.project;

  project.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(project);
    }
  });
};

/**
 * List of Projects
 */
exports.list = function (req, res) {
  Project.find().sort('-created').populate('user', 'displayName').exec(function (err, projects) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(projects);
    }
  });
};

/**
 * List of project Bids
 */
exports.projectBids = function (req, res) {
  var project = req.project;

  Bid.find({ _id: { $in : project.bids}}).sort('bid_price').populate('user', 'displayName').exec(function (err, bids) {
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
 * Project middleware
 */
exports.projectByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Project is invalid'
    });
  }

  Project.findById(id).populate('user', 'displayName').exec(function (err, project) {
    if (err) {
      return next(err);
    } else if (!project) {
      return res.status(404).send({
        message: 'No project with that identifier has been found'
      });
    }
    req.project = project;
    next();
  });
};
