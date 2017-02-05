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
  project_state: {
    type: String,
    default: '',
    required: 'Must select public or private project'
  },
  shipping_address: {
    type: String,
    default: '',
    trim: true,
    required: 'Shipping address cannot be blank'
  },
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel',
    required: 'At least one panel model is required'
    }],
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
  Bid.remove({project: this._id}, next);
});

mongoose.model('Project', ProjectSchema);