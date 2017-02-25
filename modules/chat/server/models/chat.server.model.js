'use strict';

/*
 * Module Dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/*
 * Chat Schema
 */
var ChatSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  members: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  messages: [{
    created: {
      type: Date,
      default: Date.now
    },
    user: {
      type: Schema.ObjectId,
      ref: 'User'
    },
    messageType: {
      type: String,
      required: 'Message type is required',
    },
    content: {
      type: String,
      required: 'Message requires content'
    },
    displayName: {
      type: String,
      required: 'Display name is required'
    },
    profileImageURL: {
      type: String,
      default: 'modules/users/client/img/profile/default.png'
    }
  }]
});

mongoose.model('Chat', ChatSchema);
