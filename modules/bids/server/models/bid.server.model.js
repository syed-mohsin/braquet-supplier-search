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
 * Bid Schema
 *
 */
var BidSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  fob_shipping: {
    type: String,
    default: '',
    trim: true,
    required: 'Item Location cannot be blank'
  },
  delivery_date: {
    type: Date,
    default: '',
    trim: true,
    required: 'Delivery Date cannot be blank'
  },
  bid_price: {
    type: Currency,
    min: 0,
    max: 100000000
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  project: {
    type: Schema.ObjectId,
    ref: 'Project'
  },
  project_title: {
    type: String,
  }
});

mongoose.model('Bid', BidSchema);