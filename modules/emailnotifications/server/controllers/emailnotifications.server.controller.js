'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  EmailNotification = mongoose.model('EmailNotification'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a emailNotification
 */
exports.create = function (req, res) {
  var emailNotification = new EmailNotification();
  emailNotification.user = req.user;

  emailNotification.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(emailNotification);
    }
  });
};

/**
 * Follow/Unfollow an organization
 */
exports.followOrganization = function (req, res) {
  EmailNotification.findOne({ user: req.user._id })
  .exec()
  .then(function(emailNotification) {
    // create email notification for user if one does not exist
    if (!emailNotification) {
      emailNotification = new EmailNotification();
      emailNotification.user = req.user;
    }

    // decide whether to follow or unfollow organization
    var orgIndex = emailNotification.followingOrganizations.indexOf(req.organization.id);
    if (orgIndex !== -1) {
      emailNotification.followingOrganizations.splice(orgIndex, 1);
    } else {
      emailNotification.followingOrganizations.push(req.organization._id);
    }

    return emailNotification.save();
  })
  .then(function(savedEmailOrganization) {
    res.json(savedEmailOrganization);
  })
  .catch(function(err) {
    res.status(400).json(err);
  });
};

/**
 * Show the current emailNotification
 */
exports.read = function (req, res) {
  res.json(req.emailNotification);
};

/**
 * Update a emailNotification
 */
exports.update = function (req, res) {
  var emailNotification = req.emailNotification;

  emailNotification.title = req.body.title;
  emailNotification.content = req.body.content;

  emailNotification.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(emailNotification);
    }
  });
};

/**
 * Delete an emailNotification
 */
exports.delete = function (req, res) {
  var emailNotification = req.emailNotification;

  emailNotification.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(emailNotification);
    }
  });
};

/**
 * List of EmailNotifications
 */
exports.list = function (req, res) {
  EmailNotification.find()
  .sort('-created')
  .populate('user', 'displayName')
  .exec(function (err, emailNotifications) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(emailNotifications);
    }
  });
};

/**
 * EmailNotification middleware
 */
exports.emailNotificationByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'EmailNotification is invalid'
    });
  }

  EmailNotification.findById(id).populate('user', 'displayName').exec(function (err, emailNotification) {
    if (err) {
      return next(err);
    } else if (!emailNotification) {
      return res.status(404).send({
        message: 'No emailNotification with that identifier has been found'
      });
    }
    req.emailNotification = emailNotification;
    next();
  });
};
