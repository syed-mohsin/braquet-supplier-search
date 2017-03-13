'use strict';

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';

mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});

// register relevant models
require('../modules/organizations/server/models/organization.server.model');
require('../modules/panels/server/models/panelmodel.server.model');
require('../modules/users/server/models/user.server.model');
require('../modules/reviews/server/models/review.server.model');



var Organization = mongoose.model('Organization');

Organization.find()
  .exec()
  .then(function(orgs) {
    console.log(orgs.length);
  });
