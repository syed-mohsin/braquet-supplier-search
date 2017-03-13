'use strict';

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';
var Organization;

mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});

// register relevant models
require('../modules/organizations/server/models/organization.server.model');
console.log(mongoose.models);
require('../modules/panels/server/models/panelmodel.server.model');
console.log(mongoose.models);
require('../modules/users/server/models/user.server.model');
console.log(mongoose.models);
require('../modules/reviews/server/models/review.server.model');
console.log(mongoose.models);


  // Organization = mongoose.model('Organization');
  // Organization.find({}, function(err, orgs) {
  //   console.log('hello');
  //   if (err) console.log(err);
  //   else console.log(orgs.length);
  // });
