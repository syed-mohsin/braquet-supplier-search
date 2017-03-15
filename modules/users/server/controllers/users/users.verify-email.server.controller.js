'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
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

    user.emailVerified = true;
    user.save(function(err) {
      if (err) {
        return res.redirect('/forbidden');
      } else {
        // successfully verified email
        req.login(user, function (err) {
          if (err) {
            return res.redirect('/forbidden');
          } else {

            async.waterfall([
              function(done) {
                var httpTransport = 'http://';
                if (config.secure && config.secure.ssl === true) {
                  httpTransport = 'https://';
                }

                res.render('modules/users/server/templates/notify-email', {
                  name: user.displayName,
                  email: user.email
                }, function(err, emailHTML) {
                  done(err, emailHTML);
                });
              },
              // send notify email to Braquet admin using service
              function(emailHTML, done) {
                var mailList = 'syedm.90@gmail.com, takayuki.koizumi@gmail.com, dbnajafi@gmail.com';

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
                });
              }
            ], function(err) {
              if(err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              }
            });
            res.redirect('/');
          }
        });
      }
    });
  });
};
