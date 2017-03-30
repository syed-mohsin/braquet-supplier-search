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
