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

  async.waterfall([
    function(done){
      User.findOne({ inviteToken: req.params.token }, function(err, user){
        if (!user) {
          return res.redirect('/forbidden');
        }

        done(err, user);
      });
    },
    function(user, done){
      // only make all reviews public if
      // admin has already verified user
      if (user.verified) {
        Review.update(
          {
            user: user._id,
            verified: false
          },
          {
            $set: { verified: true }
          },
          {
            multi: true
          },
          function(err, reviews) {
            if (err) {
              return res.redirect('/forbidden');
            }
            done(err, user);
          });
      } else {
        // do not make reviews public
        var err = '';
        done(err, user);
      }
    },
    function(user, done) {
      Review.find({ user: user._id })
      .populate('organization')
      .then(function(reviews) {
        // save all orgs to update review stats
        var orgPromises = reviews.map(function(review) {
          return review.organization.save();
        });

        return Promise.all(orgPromises);
      })
      .then(function(savedOrgs) {
        var err = '';
        done(err, user);
      })
      .catch(function(err) {
        done(err, user);
      });
    },
    function(user, done) {
      // verify user has confirmed email
      user.emailVerified = true;

      user.save(function(err) {
        if(err) {
          return res.redirect('/forbidden');
        } else {
          // successfully verified email
          done(err, user);
        }
      });
    },
    function(user, done) {
      // successfully verified email
      req.login(user, function (err) {
        if(err) {
          return res.redirect('/forbidden');
        } else {
          res.render('modules/users/server/templates/notify-email', {
            name: user.displayName,
            email: user.email
          }, function(err, emailHTML) {
            done(err, emailHTML, user);
          });
        }
      });
    },
    // send notify email to Braquet admin using service
    function(emailHTML, user, done) {
      var mailList = process.env.MAILER_INTERNAL_LIST;

      var mailOptions = {
        to: mailList,
        from: config.mailer.from,
        subject: 'Braquet - Notification of User Confirmation',
        html: emailHTML
      };

      smtpTransport.sendMail(mailOptions, function (err) {
        if (err) {
          return res.status(400).send({
            message: 'Failure sending notification email'
          });
        }
        return res.redirect('/');
      });
    }],
    function(err) {
      if(err) {
        res.redirect('/forbidden');
      }
    }
  );
};
