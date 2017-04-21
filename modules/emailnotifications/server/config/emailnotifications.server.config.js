'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  EmailNotification = mongoose.model('EmailNotification'),
  schedule = require('node-schedule');

/**
 * Module init function.
 */
module.exports = function (app, db) {
  // initialize scheduled emailing
  var rule = new schedule.RecurrenceRule();
  rule.minute = 9;

  var j = schedule.scheduleJob(rule, function(){
    console.log('The answer to life, the universe, and everything!');
  });
};
