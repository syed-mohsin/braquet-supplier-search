'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mg = require('../config/lib/mongoose');

mongoose.connect(process.env.MONGO_PRODUCTION_CONNECTION_URL);
// mongoose.connect('mongodb://localhost/mean-dev');

// register modules
mg.loadModels();

var Organization = mongoose.model('Organization');

Organization.find().exec()
.then(function(organizations) {
  console.log(organizations.length);
  organizations.forEach(function(organization) {
    console.log('https://www.braquet.io/organizations/' + organization.urlName);
  });
  process.exit(0);
})
.catch(function(err) {
  console.log('found no orgs', err);
  process.exit(1);
})
