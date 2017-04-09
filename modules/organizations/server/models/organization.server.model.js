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
 * Organization Schema
 */
var OrganizationSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean
  },
  admin: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  users: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  possibleUsers: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  companyName: {
    type: String,
    required: 'Organization name is required'
  },
  logoImageUrl: {
    type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  reviews: [{
    type: Schema.ObjectId,
    ref: 'Review'
  }],
  priceReviews: [{
    type: Schema.ObjectId,
    ref: 'PriceReview'
  }],
  avg_review: {
    type: Number,
    default: 0
  },
  reviews_length: {
    type: Number,
    default: 0
  },
  price_reviews_length: {
    type: Number,
    default: 0
  },
  panel_models: [{
    type: Schema.ObjectId,
    ref: 'PanelModel'
  }],
  panels_length: {
    type: Number,
    default: 0
  },
  manufacturers: [{
    type: String
  }],
  industry: {
    type: String
  },
  productTypes: {
    type: String
  },
  url: {
    type: String,
    required: 'Company Website is required'
  },
  address1: {
    type: String
  },
  address2: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  zipcode: {
    type: String
  },
  country: {
    type: String
  },
  about: {
    type: String
  }
});

OrganizationSchema.pre('save', function(next) {

  var Review = mongoose.model('Review'),
    PriceReview = mongoose.model('PriceReview'),
    PanelModel = mongoose.model('PanelModel');

  var self = this;

  // set number of panels
  self.panels_length = self.panel_models.length;

  PanelModel.find({ _id: { $in: self.panel_models } }).exec()
  .then(function(panelModels) {
    // extract all brands from panels
    self.manufacturers = panelModels.reduce(function(manArr, panelModel) {
      if (manArr.indexOf(panelModel.manufacturer) === -1) {
        manArr.push(panelModel.manufacturer);
      }

      return manArr;
    }, []);

    // associate all organization with its panel models
    var panelModelPromises = panelModels.map(function(panelModel) {
      var sellerAlreadyExists = panelModel.sellers.some(function(sellerId) {
        return sellerId.equals(self._id);
      });

      if (!sellerAlreadyExists) {
        panelModel.sellers.push(self._id);
      }

      return panelModel.save();
    });

    return Promise.all(panelModelPromises);
  })
  .then(function(savedPanelModels) {
    // set reviews_length and avg_review and remove stale reviews
    return Review.find({ _id: { $in: self.reviews }, verified: true }, 'rating')
    .exec();
  })
  .then(function(reviews) {
    // remove invalid review ids if any
    self.reviews = reviews.map(function(review) {
      if (mongoose.Types.ObjectId.isValid(review._id)) {
        return review._id;
      } else {
        return review;
      }
    });

    // update reviews length for querying in catalog
    self.reviews_length = reviews.length;

    // calculate new average review
    self.avg_review = reviews.reduce(function(a,b) {
      return a + b.rating;
    }, 0) / reviews.length || 0;

    return PriceReview.find({ _id: { $in: self.priceReviews }, verified: true }, 'price quantity')
      .exec();
  })
  .then(function(priceReviews) {
    // remove invalid price review ids if any
    self.priceReviews = priceReviews.map(function(priceReview) {
      if (mongoose.Types.ObjectId.isValid(priceReview._id)) {
        return priceReview._id;
      } else {
        return priceReview;
      }
    });

    // update reviews length for querying in catalog
    self.price_reviews_length = priceReviews.length;

    // finish
    next();
  })
  .catch(function(err) {
    console.log('there was an error with org prehook saving', err);
    next();
  });
});

mongoose.model('Organization', OrganizationSchema);
