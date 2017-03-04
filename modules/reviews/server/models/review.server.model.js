'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Review Schema
 */
var ReviewSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  rating: {
    type: Number,
    enum: [1,2,3,4,5]
  },
  content: {
    type: String,
    trim: true,
    required: 'Content cannot be blank'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Review', ReviewSchema);
