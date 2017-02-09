'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Project Schema
 */
var OrganizationSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  users: [{
  	type: Schema.ObjectId,
    ref: 'User',
  }],
  name: {
  	type: String,
  	required: 'Organization name is required'
  },
  logoImageUrl: {
  	type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel',
    required: 'Must select at least one panel model'
  }],
  industry: {
  	type: String
  }, 
  product_types: [{
  	type: String
  }],
  website: {
  	type: String
  },
  headquarters: {
  	type: String
  },
  about: {
  	type: String
  }
});

mongoose.model('Organization', OrganizationSchema);