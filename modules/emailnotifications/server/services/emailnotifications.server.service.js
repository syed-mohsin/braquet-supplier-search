'use strict';

var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  OrganizationService = require('../../../organizations/server/services/organizations.server.service'),
  EmailNotification = mongoose.model('EmailNotification'),
  mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

exports.sendEmailToUser = function(app) {
  // initialize scheduled emailing
  var ONE_DAY = 24*60*60*1000;
  var dateCheck = new Date(Date.now() - ONE_DAY*100);

  var data = {
    from: 'Braquet <no-reply@braquet.io>',
    to: process.env.NOTIFICATION_TEST_EMAIL,
    subject: 'Test Update'
  };

  return new Promise(function(resolve, reject) {
    User.findOne({ email: process.env.NOTIFICATION_TEST_EMAIL }).exec()
    .then(function(user) {
      console.log('user', user._id);
      return EmailNotification.findOne({ user: user._id }).exec();
    })
    .then(function(emailNotification) {
      if (!emailNotification) {
        throw new Error('email notification does not exist');
      }
      console.log('emailNotification', emailNotification);

      return Organization.find({
        _id: { $in: emailNotification.followingOrganizations },
        updated: { $gt: dateCheck }
      }).populate('priceReviews').lean().exec();
    })
    .then(function(orgs) {
      console.log('orgs', orgs.length);
      orgs = OrganizationService.extractBrands(orgs);
      orgs = orgs.filter(function(org) {
        return isFinite(org.brands_avg_min);
      });
      orgs = orgs.map(function(org) {
        org.id = org._id.toString();
        return org;
      });

      return new Promise(function(resolve, reject) {

        app.render('modules/emailnotifications/server/templates/user-update', {
          organizations: orgs
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
      console.log('getting email html');
      data.html = emailHTML;
      return mailgun.messages().send(data);
    })
    .then(function(body) {
      console.log('about to resolve email body');
      resolve(body);
    })
    .catch(function(err) {
      reject(err);
    });
  });
};
