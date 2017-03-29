'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Pricing Review Schema
 */
var PricingReviewSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
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
    enum: ['Asia/Australia', 'Africa', 'Europe', 'N. America', 'S. America'],
    required: 'Please specify a shipping location'
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

mongoose.model('PricingReview', PricingReviewSchema);
