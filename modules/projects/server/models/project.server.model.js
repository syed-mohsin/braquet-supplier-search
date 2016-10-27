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
  system_capacity: {
    type: Number,
    trim: true,
    required: 'System Capacity cannot be blank'
  },
  bid_deadline: {
    type: Date,
    default: '',
    trim: true,
    required: 'Bid Deadline cannot be blank'
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  shipping_address: {
    type: String,
    default: '',
    trim: true,
    required: 'Shipping address cannot be blank'
  },
  panel_model: {
    type: String,
    default: '',
    trim: true,
    required: 'Panel Model cannot be blank'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  bids: [{type: Schema.ObjectId, 
          ref: 'Bid'}]
});

mongoose.model('Project', ProjectSchema);


  // panel_wattage: {
  //   type: String,
  //   default: '',
  //   trim: true,
  //   required: 'Panel Wattage cannot be blank'
  // },
  // panel_type: {
  //   type: String,
  //   required: 'Panel Type is Required (Monocrystalline or Polycrystalline)'
  // }