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
        console.log(user);

        done(err, user);
      });
    },
    function(user, done){
      console.log('*******111111**********');
      console.log(user);
      console.log('*******1.5**********');
      // verify user has confirmed email
      user.emailVerified = true;

      Review.update(
        {
          user: user._id,
          verified: false
        },
        { 
          $set: { verified: true }
        }, 
        function(err, reviews) {
          if (err) {
            console.log('*******ERROR**********');
            return res.redirect('/forbidden');
          }
          console.log('*******1.6666**********');
          done(err, user);
        });
    },
    function(user, done) {
      console.log('*******2222222**********');
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
      console.log('*******3333333**********');
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
      console.log('*******444444**********');

      // var mailList = 'syedm.90@gmail.com, takayuki.koizumi@gmail.com, dbnajafi@gmail.com';

      var mailList = 'dbnajafi@gmail.com';

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
        console.log('*******HOLY SHIT**********');
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    }
  );
};
