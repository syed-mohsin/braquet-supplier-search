'use strict';

var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  OrganizationService = require('../../../organizations/server/services/organizations.server.service'),
  EmailNotification = mongoose.model('EmailNotification'),
  mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

/*
 * Helper function to send tailored email to a user
 */
exports.sendEmailNotificationToUser = function(app, user, frequency) {
  // initialize scheduled emailing
  var ONE_DAY = 24*60*60*1000;
  var dateCheck = new Date(Date.now() - ONE_DAY*(frequency || 7));

  var data = {
    from: 'Braquet <no-reply@braquet.io>',
    to: user.email,
    subject: 'Braquet - Module Pricing Update'
  };

  // wrap the logic of processing data and sending email
  // in a promise
  return new Promise(function(resolve, reject) {
    // find notification associated with user
    EmailNotification.findOne({ user: user._id, isSubscribed: true })
    .exec()
    .then(function(emailNotification) {
      if (!emailNotification) {
        throw new Error('email notification does not exist or user is unsubscribed', user.displayName);
      }

      // use email notification document to fetch any updated organizations
      return Organization.find({
        _id: { $in: emailNotification.followingOrganizations },
        updated: { $gt: dateCheck }
      })
      .populate('priceReviews')
      .lean()
      .exec();
    })
    .then(function(orgs) {
      if (!orgs.length) {
        throw new Error('No organizations update for following user', user.email);
      }

      // add brand pricing data for organizations
      orgs = OrganizationService.extractBrands(orgs);
      orgs = orgs.filter(function(org) {
        return isFinite(org.brands_avg_min);
      });
      orgs = orgs.map(function(org) {
        org.id = org._id.toString();
        return org;
      });

      // promise that returns hydrated email template that will be sent to user
      return new Promise(function(resolve, reject) {
        app.render('modules/emailnotifications/server/templates/user-update', {
          organizations: orgs,
          user: user
        }, function(err, emailHTML) {
          if(err) {
            reject(err);
          } else {
            resolve(emailHTML);
          }
        });
      });
    })
    .then(function(emailHTML) {
      // send email using Mailgun API
      data.html = emailHTML;
      if (user.email === process.env.NOTIFICATION_TEST_EMAIL) {
        return mailgun.messages().send(data);
      } else {
        return 'test, not sending email yet';
      }
    })
    .then(function(body) {
      resolve(body);
    })
    .catch(function(err) {
      reject(err);
    });
  });
};

/*
 * Service function used to send a periodic email to every user
 */
exports.sendEmailNotificationToUsers = function(app, frequency) {
  // fetch all verified users
  User.find({ verified: true })
  .then(function(users) {
    // send email notification per user and log success or errors
    users.forEach(function(user) {
      return exports.sendEmailNotificationToUser(app, user, frequency)
        .then(function(resp) {
          console.log('SUCCESS', resp);
        })
        .catch(function(err) {
          console.log('FAILED FOR USER', user.displayName, 'WITH EMAIL:', user.email);
          console.log(err);
        });
    });
  })
  .catch(function(err) {
    console.log('failed to fetch users', err);
  });
};
