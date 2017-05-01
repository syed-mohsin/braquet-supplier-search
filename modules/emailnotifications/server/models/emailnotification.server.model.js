'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * EmailNotification Schema
 */
var EmailNotificationSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },
  frequency: {
    type: Number,
    enum: [1,2,3,5,7,14,30],
    default: 7
  },
  followingOrganizations: [{
    type: Schema.ObjectId,
    ref: 'Organization'
  }],
  brands: [{
    type: String
  }],
  stcPowers: [{
    type: Number
  }],
  panelTypes: [{
    type: String
  }],
  followingPanels: [{
    type: Schema.ObjectId,
    ref: 'PanelModel'
  }],
  isSubscribed: {
    type: Boolean,
    default: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('EmailNotification', EmailNotificationSchema);
