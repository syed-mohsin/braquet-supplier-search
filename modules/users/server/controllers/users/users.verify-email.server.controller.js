'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Review = mongoose.model('Review'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Validate token for email confirmation
 */
exports.validateEmail = function (req, res) {
  User.findOne({
    inviteToken: req.params.token,
  }, function (err, user) {
    if (!user) {
      return res.redirect('/forbidden');
    }

    // verify user has confirmed email
    user.emailVerified = true;

    // set all user's reviews to verified
    Review.update({
      user: user._id,
      verified: false
    }, { $set: { verified: true } }, function(err, reviews) {
      if (err) return res.redirect('/forbidden');

      // finally save and log in user
      user.save(function(err) {
        if (err) {
          return res.redirect('/forbidden');
        } else {
          // successfully verified email
          req.login(user, function (err) {
            if (err) {
              return res.redirect('/forbidden');
            } else {
              res.redirect('/');
            }
          });
        }
      });

    });
  });
};
