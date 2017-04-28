'use strict';

var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  OrganizationService = require('../../../organizations/server/services/organizations.server.service'),
  EmailNotification = mongoose.model('EmailNotification'),
  mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

exports.sendEmailNotificationToUser = function(app, user) {
  // initialize scheduled emailing
  var ONE_DAY = 24*60*60*1000;
  var dateCheck = new Date(Date.now() - ONE_DAY*100);

  var data = {
    from: 'Braquet <no-reply@braquet.io>',
    to: user.email,
    subject: 'Test Update'
  };

  console.log('STARTING TO EMAIL USER', user.displayName, 'WITH EMAIL:', user.email);
  return new Promise(function(resolve, reject) {
    EmailNotification.findOne({ user: user._id, isSubscribed: true })
    .exec()
    .then(function(emailNotification) {
      if (!emailNotification) {
        throw new Error('email notification does not exist');
      }
      console.log('emailNotification', emailNotification);

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
      console.log('orgs', orgs.length);
      orgs = OrganizationService.extractBrands(orgs);
      orgs = orgs.filter(function(org) {
        return isFinite(org.brands_avg_min);
      });
      orgs = orgs.map(function(org) {
        org.id = org._id.toString();
        return org;
      });

      console.log('about to hydrate template');
      return new Promise(function(resolve, reject) {
        console.log('inside emailHtml promise');
        app.render('modules/emailnotifications/server/templates/user-update', {
          organizations: orgs,
          user: user
        }, function(err, emailHTML) {
          if(err) {
            reject(err);
          } else {
            console.log('successfully hydrated email');
            resolve(emailHTML);
          }
        });
      });
    })
    .then(function(emailHTML) {
      console.log('got email html');
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

exports.sendEmailNotificationToUsers = function(app) {
  User.find({ verified: true })
  .then(function(users) {
    console.log('THERE ARE', users.length, 'verified users');
    users.forEach(function(user) {
      return exports.sendEmailNotificationToUser(app, user)
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
