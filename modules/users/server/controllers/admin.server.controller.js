'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Review = mongoose.model('Review'),
  Organization = mongoose.model('Organization'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;

  //For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.displayName = user.firstName + ' ' + user.lastName;
  user.roles = req.body.roles;

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Verify a new user
 */
exports.verifyUser = function (req, res) {
  var user = req.model;

  if (user.verified) {
    res.status(400).send({
      message: 'User is already verified'
    });
  } else {
    // verify user and verify user's reviews
    user.verified = true;

    user.save()
    .then(function(savedUser) {
      return (
        Review.update(
          {
            user: user._id,
            verified: false
          },
          { $set: { verified: true } },
          { multi: true }
        )
      );
    })
    .then(function(updateData) {
      return Review.find({ user: user._id })
      .populate('organization')
      .exec();
    })
    .then(function(reviews) {
      // save all orgs to update review stats
      var orgPromises = reviews.map(function(review) {
        return review.organization.save();
      });

      return Promise.all(orgPromises);
    })
    .then(function(savedOrgs) {
      // successfully finished promise chain
      res.json(user);
    })
    .catch(function(err) {
      return res.status(400).json(err);
    });
  }
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  user.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  var searchQuery = {};
  var search = req.query.filter;

  if (search === 'verified') {
    searchQuery.verified = true;
  } else if (search === 'unverified') {
    searchQuery.verified = false;
  }

  User.find(searchQuery, '-salt -password')
    .sort('-created')
    .populate('user', 'displayName')
    .exec(function (err, users) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(users);
    });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id, '-salt -password').exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load user ' + id));
    }

    req.model = user;
    next();
  });
};
