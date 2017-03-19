'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// mongoose.connect('mongodb://f615e0a2-eb3c-43ef-ae60-96a42339ec2c:06851da9-1b8d-4136-8748-dee37ed578b0@ds145019.mlab.com:45019/braquet-db');
mongoose.connect('mongodb://localhost/mean-dev');

// register modules
require('../modules/organizations/server/models/organization.server.model');
require('../modules/panels/server/models/panelmodel.server.model');
require('../modules/reviews/server/models/review.server.model');


var PanelModel = mongoose.model('PanelModel'),
  Organization = mongoose.model('Organization'),
  Review = mongoose.model('Review');

Organization.find()
.populate('reviews')
.exec()
.then(function(orgs) {
  var orgPromises = orgs.map(function(org) {
    // by saving, call prehook that sets new length and avg
    return org.save();
  });

  return Promise.all(orgPromises);
})
.then(function(savedOrgs) {
  console.log(savedOrgs.length, 'org review lengths updated');
})
.catch(function(err) {
  console.log('ERR', err);
});
