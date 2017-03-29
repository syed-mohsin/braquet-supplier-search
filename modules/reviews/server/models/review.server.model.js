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
    enum: [1,2,3,4,5],
    required: 'Review is required'
  },
  content: {
    type: String,
    trim: true,
    required: 'Content cannot be blank'
  },
  category: {
    type: String,
    enum: [
      'Currently doing business with company',
      'Have done business with company',
      'Discussed business with company',
      'General',
      'Other'
    ],
    required: 'Please select a category'
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: true
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization',
    required: 'Organization is required'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'User is required'
  }
});

ReviewSchema.pre('remove', function (next) {
  var Organization = mongoose.model('Organization');
  var review = this;

  if (review.organization && mongoose.Types.ObjectId.isValid(review.organization._id)) {
    Organization.findById(review.organization._id)
    .exec()
    .then(function(org) {
      org.reviews = org.reviews.filter(function(reviewId) {
        return !review._id.equals(reviewId);
      });

      return org.save();
    })
    .then(function(savedOrg) {
      console.log('deleted review from org');
      next();
    })
    .catch(function(err) {
      console.log('failed to remove review from organization', err);
      next();
    });
  }
});

mongoose.model('Review', ReviewSchema);
