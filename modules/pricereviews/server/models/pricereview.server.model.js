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
  quoteDate: {
    type: Date,
    required: 'Quote date is required.'
  },
  deliveryDate: {
    type: Date,
    required: 'Delivery date is required.'
  },
  stcPower: {
    type: Number,
    required: 'Wattage is required'
  },
  price: {
    type: Currency,
    min: 0,
    max: 100000000,
    required: 'Unit price for quote is required'
  },
  manufacturer: {
    type: String,
    required: 'Please select a brand'
  },
  quantity: {
    type: String,
    enum: ['0kW-100kW', '101kW-500kW', '501kW-1MW', '>1MW'],
    required: 'Please specify a quantity'
  },
  panelType: {
    type: String,
    enum: ['Poly', 'Mono', 'other'],
    required: 'Please specify panel type'
  },
  includesShipping: {
    type: Boolean,
    required: 'Please specify if shipping was included'
  },
  shippingLocation: {
    type: String,
    enum: ['Asia/Australia', 'Africa', 'Europe', 'North America', 'South America'],
  },
  incoterm: {
    type: String,
    enum: ['EXW', 'FCA', 'FAS', 'FOB', 'CPT', 'CFR', 'CIF', 'CIP', 'DAT', 'DAP', 'DDP', 'Not Sure'],
    required: 'Please specify Incoterm'
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

mongoose.model('PriceReview', PriceReviewSchema);
