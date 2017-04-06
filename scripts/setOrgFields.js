'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mg = require('../config/lib/mongoose');

// mongoose.connect(process.env.MONGO_PRODUCTION_CONNECTION_URL);
mongoose.connect('mongodb://localhost/mean-dev');

// register modules
mg.loadModels();


var PanelModel = mongoose.model('PanelModel'),
  Organization = mongoose.model('Organization'),
  Review = mongoose.model('Review');

Organization.find()
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
