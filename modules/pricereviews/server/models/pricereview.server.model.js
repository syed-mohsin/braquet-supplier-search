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
 * Price Review Schema
 */
var PriceReviewSchema = new Schema({
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
  manufacturer: {
    type: String,
  },
  quantity: {
    type: String,
    enum: ['0kW-100kW', '101kW-1MW', '>1MW'],
    required: 'Please specify a quantity'
  },
  stcPower: {
    type: Number
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

PriceReviewSchema.pre('remove', function (next) {
  var Organization = mongoose.model('Organization');
  var priceReview = this;
  var organizationId = '';

  if (priceReview.organization && mongoose.Types.ObjectId.isValid(priceReview.organization._id)) {
    organizationId = priceReview.organization._id;
  } else if (priceReview.organization && mongoose.Types.ObjectId.isValid(priceReview.organization)) {
    organizationId = priceReview.organization;
  } else {
    console.log('unable to update organization after deleting price review');
    next();
  }

  Organization.findById(organizationId)
  .exec()
  .then(function(org) {
    org.priceReviews = org.priceReviews.filter(function(priceReviewId) {
      return !priceReview._id.equals(priceReviewId);
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

mongoose.model('PriceReview', PriceReviewSchema);
