'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  EmailNotification = mongoose.model('EmailNotification'),
  mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }),
  schedule = require('node-schedule');

/**
 * Module init function.
 */
module.exports = function (app, db) {
  // initialize scheduled emailing
  var rule = new schedule.RecurrenceRule();
  rule.minute = 37;

  var j = schedule.scheduleJob(rule, function(){
    var data = {
      from: 'no-reply <no-reply@braquet.io>',
      to: 'syedm.90@gmail.com',
      subject: 'Test',
      text: 'Testing mailgun API'
    };

    mailgun.messages().send(data, function (err, body) {
      if (err) {
        console.log(err);
      }
      console.log('body', body);
    });

    console.log('The answer to life, the universe, and everything!');
  });
};
