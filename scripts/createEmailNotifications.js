'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mg = require('../config/lib/mongoose');

// mongoose.connect(process.env.MONGO_PRODUCTION_CONNECTION_URL);
mongoose.connect('mongodb://localhost/mean-dev');

// register modules
mg.loadModels();

var EmailNotification = mongoose.model('EmailNotification'),
  User = mongoose.model('User');

User.find().exec()
  .then(function(users) {
    users.forEach(function(user) {
      EmailNotification.findOne({ user: user._id }).exec()
      .then(function(emailNotification) {
        if (!emailNotification) {
          var emailNotification = new EmailNotification();
          emailNotification.user = user._id;
          emailNotification.save(function(err) {
            if (err) {
              console.log('could not create new emailNotification for user', user.displayName);
            } else {
              console.log('successfully created new emailNotification for user', user.displayName);
            }
          });
        }
      });
    });
  })
  .catch(function(err) {
    console.log(err);
  });
