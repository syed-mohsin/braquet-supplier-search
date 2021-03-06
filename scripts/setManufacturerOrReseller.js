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
.populate('reviews')
.exec()
.then(function(orgs) {
  var orgPromises = orgs.map(function(org) {
    // by saving, call prehook that sets new length and avg
    org.isManufacturer = org.manufacturers.length === 1;
    return org.save();
  });

  return Promise.all(orgPromises);
})
.then(function(savedOrgs) {
  console.log(savedOrgs.length, 'org isManufacturers updated');
  process.exit(0);
})
.catch(function(err) {
  console.log('ERR', err);
  process.exit(1);
});
