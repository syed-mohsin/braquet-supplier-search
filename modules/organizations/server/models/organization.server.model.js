'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Organization Schema
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
    type: Number,
    default: 0
  },
  reviews_length: {
    type: Number,
    default: 0
  },
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel'
  }],
  panels_length: {
    type: Number,
    default: 0
  },
  panel_manufacturers: [{
    type: String
  }],
  panel_crystalline_types: [{
    type: String
  }],
  panel_frame_colors: [{
    type: String
  }],
  panel_number_of_cells: [{
    type: Number
  }],
  panel_stcPowers: [{
    type: Number
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

  var Review = mongoose.model('Review');

  // set number of panels
  this.panels_length = this.panel_models.length;

  // remove invalid review ids if any
  this.reviews = this.reviews.map(function(review) {
    return review._id;
  });

  // set reviews_length and avg_review
  var self = this;
  Review.find({ _id: { $in: this.reviews } }, 'rating')
  .exec()
  .then(function(reviews) {
    // update reviews length for querying in catalog
    self.reviews_length = reviews.length;

    // calculate new average review
    self.avg_review = reviews.reduce(function(a,b) {
      return a + b.rating;
    }, 0) / reviews.length || 0;

    // finish
    next();
  })
  .catch(function(err) {
    console.log('there was an error with org prehook saving', err);
    next();
  });
});

mongoose.model('Organization', OrganizationSchema);
