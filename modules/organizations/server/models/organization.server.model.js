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
  companyName: {
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
  avg_review: {
    type: Number
  },
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel',
  }],
  industry: {
    type: String
  },
  productTypes: {
    type: String
  },
  url: {
    type: String,
    required: 'Company Website is required'
  },
  address1: {
    type: String
  },
  address2: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  zipcode: {
    type: String
  },
  country: {
    type: String
  },
  about: {
    type: String
  }
});

OrganizationSchema.pre('save', function(next) {
  var self = this;
  this.avg_review = this.reviews.reduce(function(a,b) {
    return a + b.rating;
  }, 0) / this.reviews.length;

  next();
});

mongoose.model('Organization', OrganizationSchema);
