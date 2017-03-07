'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Bid = mongoose.model('Bid'),
  Schema = mongoose.Schema;

/**
 * Project Schema
 */
var ProjectSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  quantity: {
    type: Number,
    trim: true,
    required: 'quantity cannot be blank'
  },
  bid_deadline: {
    type: Date,
    default: '',
    trim: true,
    required: 'Bid Deadline cannot be blank'
  },
  note: {
    type: String,
    default: '',
    trim: true
  },
  project_state: {
    type: String,
    default: '',
    required: 'Must select public or private project'
  },
  shipping_address_1: {
    type: String,
    default: '',
    trim: true,
    required: 'Shipping address cannot be blank'
  },
  shipping_address_2: {
    type: String,
    default: '',
    trim: true,
  },
  shipping_address_city: {
    type: String,
    default: '',
    trim: true,
    required: 'City cannot be blank'
  },
  shipping_address_state: {
    type: String,
    default: '',
    trim: true,
    required: 'State cannot be blank'
  },
  shipping_address_zip_code: {
    type: String,
    default: '',
    trim: true,
    required: 'Zip Code cannot be blank'
  },
  shipping_address_country: {
    type: String,
    default: '',
    trim: true,
    required: 'Country cannot be blank'
  },
  preferred_payment_term: {
    type: String,
    default: '',
    trim: true,
  },
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel',
    required: 'At least one panel model is required'
  }],
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'no user associated with project'
  },
  bidders: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  bids: [{
    type: Schema.ObjectId,
    ref: 'Bid'
  }]
});

ProjectSchema.pre('remove', function (next) {
  var project = this;

  // delete all bids that contain project_id
  Bid.remove({ project: this._id }, next);
});

mongoose.model('Project', ProjectSchema);
