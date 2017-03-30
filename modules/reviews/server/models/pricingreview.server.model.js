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
 * Pricing Review Schema
 */
var PricingReviewSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  price: {
    type: Currency,
    min: 0,
    max: 100000000,
    required: 'Unit price for quote is required'
  },
  quantity: {
    type: String,
    enum: ['0kW-100kW', '101kW-1MW', '>1MW'],
    required: 'Please specify a quantity'
  },
  panelType: {
    type: String,
    enum: ['Poly', 'Mono'],
    required: 'Please specify panel type'
  },
  shippingLocation: {
    type: String,
    enum: ['Asia/Australia', 'Africa', 'Europe', 'North America', 'South America'],
    required: 'Please specify a shipping location'
  },
  verified: {
    type: Boolean,
    default: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'User is required'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization',
    required: 'Organization is required'
  }
});

PricingReviewSchema.pre('remove', function (next) {
  var Organization = mongoose.model('Organization');
  var pricingReview = this;
  var organizationId = '';

  if (pricingReview.organization && mongoose.Types.ObjectId.isValid(pricingReview.organization._id)) {
    organizationId = pricingReview.organization._id;
  } else if (pricingReview.organization && mongoose.Types.ObjectId.isValid(pricingReview.organization)) {
    organizationId = pricingReview.organization;
  } else {
    console.log('unable to update organization after deleting pricing review');
    next();
  }

  Organization.findById(organizationId)
  .exec()
  .then(function(org) {
    org.pricingReviews = org.pricingReviews.filter(function(pricingReviewId) {
      return !pricingReview._id.equals(pricingReviewId);
    });

    return org.save();
  })
  .then(function(savedOrg) {
    console.log('deleted review from org');
    next();
  })
  .catch(function(err) {
    console.log('failed to remove review from organization', err);
    next();
  });

});

mongoose.model('PricingReview', PricingReviewSchema);
