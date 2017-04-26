'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization'),
  OrganizationService = require('../../../organizations/server/services/organizations.server.service'),
  EmailNotification = mongoose.model('EmailNotification'),
  mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }),
  schedule = require('node-schedule');

/**
 * Module init function.
 */
module.exports = function (app, db) {
  // initialize scheduled emailing
  var rule = new schedule.RecurrenceRule();
  var ONE_DAY = 24*60*60*1000;
  var dateCheck = new Date(Date.now() - ONE_DAY);
  rule.minute = 44;

  var data = {
    from: 'Braquet <no-reply@braquet.io>',
    to: process.env.NOTIFICATION_TEST_EMAIL,
    subject: 'Test Update'
  };

  User.findOne({ email: process.env.NOTIFICATION_TEST_EMAIL }).exec()
  .then(function(user) {
    return EmailNotification.findOne({ user: user._id }).exec();
  })
  .then(function(emailNotification) {
    return Organization.find({
      _id: { $in: emailNotification.followingOrganizations },
      updated: { $gt: dateCheck }
    }).populate('priceReviews').lean().exec();
  })
  .then(function(orgs) {
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
        }
        resolve(emailHTML);
      });
    });
  })
  .then(function(emailHTML) {
    data.html = emailHTML;
    mailgun.messages().send(data, function (err, body) {
      if (err) {
        console.log(err);
      } else {
        console.log('body', body);
      }
    });
  })
  .catch(function(err) {
    console.log('failed to fetch user', err);
  });

  var j = schedule.scheduleJob(rule, function(){

  });
};
