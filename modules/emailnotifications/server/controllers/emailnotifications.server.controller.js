'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  EmailNotification = mongoose.model('EmailNotification'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Handle Mailgun Unsubscribe Webhook
 */
exports.unsubscribe = function (req, res) {
  if (!req.params.token) {
    res.redirect('/forbidden');
  }

  User.findOne({ inviteToken: req.params.token })
  .exec()
  .then(function(user) {
    if (!user) {
      throw new Error('no user found!');
    } else if (!req.user || !req.user._id.equals(user._id)) {
      throw new Error('invalid user');
    }

    return EmailNotification.findOne({ user: user._id })
    .exec();
  })
  .then(function(emailNotification) {
    if (!emailNotification) {
      throw new Error('no email notification doc!');
    }

    emailNotification.isSubscribed = false;
    return emailNotification.save();
  })
  .then(function(savedEmailNotification) {
    res.send('unsubscribed');
  })
  .catch(function(err) {
    console.log('failed to unsubscribe', err);
    res.redirect('/forbidden');
  });
};

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
  var isFollowing = false; // to determine if this is follow or unfollow action

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
      isFollowing = true;
    }

    return emailNotification.save();
  })
  .then(function(savedEmailNotification) {
    res.json({
      newEmailNotification: savedEmailNotification,
      isFollowing: isFollowing
    });
  })
  .catch(function(err) {
    res.status(400).json(err);
  });
};

/**
 * Find current user's emailNotification preferences
 */
exports.getUserEmailNotification = function (req, res) {
  if (!req.user) {
    return res.status(400).json({
      message: 'No user exists'
    });
  }

  EmailNotification.findOne({ user: req.user._id })
  .exec()
  .then(function(emailNotification) {
    res.json(emailNotification);
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
