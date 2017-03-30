'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Load Currency type to the Mongoose Schema types
 */
require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;

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
  pricingReviews: [{
    type: Schema.ObjectId,
    ref: 'PricingReview'
  }],
  avg_review: {
    type: Number,
    default: 0
  },
  avg_price: {
    type: Currency,
    default: 0
  },
  reviews_length: {
    type: Number,
    default: 0
  },
  pricing_reviews_length: {
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

  var Review = mongoose.model('Review'),
    PricingReview = mongoose.model('PricingReview');

  // set number of panels
  this.panels_length = this.panel_models.length;

  // set reviews_length and avg_review and remove stale reviews
  var self = this;
  Review.find({ _id: { $in: self.reviews }, verified: true }, 'rating')
  .exec()
  .then(function(reviews) {
    // remove invalid review ids if any
    self.reviews = self.reviews.map(function(review) {
      if (mongoose.Types.ObjectId.isValid(review._id)) {
        return review._id;
      } else {
        return review;
      }
    });

    // update reviews length for querying in catalog
    self.reviews_length = reviews.length;

    // calculate new average review
    self.avg_review = reviews.reduce(function(a,b) {
      return a + b.rating;
    }, 0) / reviews.length || 0;

    return PricingReview.find({ _id: { $in: self.pricingReviews }, verified: true }, 'price')
      .exec();
  })
  .then(function(pricingReviews) {
    // remove invalid pricing review ids if any
    self.pricingReviews = self.pricingReviews.map(function(pricingReview) {
      if (mongoose.Types.ObjectId.isValid(pricingReview._id)) {
        return pricingReview._id;
      } else {
        return pricingReview;
      }
    });

    // update reviews length for querying in catalog
    self.pricing_reviews_length = pricingReviews.length;

    // calculate new average review
    var avg_price = pricingReviews.reduce(function(a,b) {
      return a + b.price / 100;
    }, 0) / pricingReviews.length || 0;

    // set new avg_price
    self.avg_price = avg_price * 100;

    // finish
    next();
  })
  .catch(function(err) {
    console.log('there was an error with org prehook saving', err);
    next();
  });
});

mongoose.model('Organization', OrganizationSchema);
