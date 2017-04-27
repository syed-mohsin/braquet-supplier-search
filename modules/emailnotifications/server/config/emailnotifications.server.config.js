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
  var rule = new schedule.RecurrenceRule();
  rule.minute = 44;

  // var job = schedule.scheduleJob(rule, function(){
  //
  // });
  //
  EmailNotificationService.sendEmailNotificationToUsers(app);
};
