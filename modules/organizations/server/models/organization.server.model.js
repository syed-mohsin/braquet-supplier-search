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
  verified: {
    type: Boolean
  },
  admin: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  users: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  possibleUsers: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  name: {
    type: String,
    required: 'Organization name is required'
  },
  logoImageUrl: {
    type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  reviews: [{
    type: Schema.ObjectId,
    ref: 'Review'
  }],
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel',
  }],
  industry: {
    type: String
  },
  product_types: [{
    type: String
  }],
  website: {
    type: String,
    required: 'Company Website is required'
  },
  headquarters: {
    type: String
  },
  about: {
    type: String
  }
});

mongoose.model('Organization', OrganizationSchema);
