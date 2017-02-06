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
  logo: {
  	type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  cover_img: {
  	type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
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