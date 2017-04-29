'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  EmailNotificationService = require('../services/emailnotifications.server.service'),
  schedule = require('node-schedule');

/**
 * Module init function.
 */
module.exports = function (app, db) {
  // initialize scheduled emailing
  var weeklyRule = new schedule.RecurrenceRule();
  weeklyRule.dayOfWeek = 1;
  weeklyRule.hour = 12;
  weeklyRule.minute = 0;

  var weeklyJob = schedule.scheduleJob(weeklyRule, function(){
    // weekly job
    var frequency = 7;
    console.log('EXECUTING INSIDE WEEKLY JOB');
    EmailNotificationService.sendEmailNotificationToUsers(app, frequency);
  });

  // initialize scheduled emailing
  var monthlyRule = new schedule.RecurrenceRule();
  monthlyRule.dayOfWeek = 1;
  monthlyRule.hour = 12;
  monthlyRule.minute = 0;
  monthlyRule.month = [new schedule.Range(0, 11)];

  var monthlyJob = schedule.scheduleJob(monthlyRule, function(){
    // monthly job
    var frequency = 30;
    console.log('EXECUTING INSIDE MONTHLY JOB');
    EmailNotificationService.sendEmailNotificationToUsers(app, frequency);
  });

  EmailNotificationService.sendEmailNotificationToUsers(app);
};
