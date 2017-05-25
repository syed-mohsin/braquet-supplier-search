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
  updated: {
    type: Date
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
  urlName: {
    type: String,
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
  panel_manufacturers: [{
    type: String
  }],
  panel_crystalline_types: [{
    type: String
  }],
  panel_frame_colors: [{
    type: String
  }],
  panel_number_of_cells: [{
    type: Number
  }],
  panel_stcPowers: [{
    type: Number
  }],
  panel_manufacturing_locations: [{
    type: String
  }],
  manufacturers: [{
    type: String
  }],
  isManufacturer: {
    type: Boolean,
    default: false
  },
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
  },
  standardPaymentTerms: {
    type: String
  },
  outsourceDelivery: {
    type: Boolean
  },
  bankability: {
    type: String,
    enum: ['Tier-1', 'Tier-2', 'Tier-3', 'Bankrupt']
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
    // reset panel filtering fields
    self.panel_manufacturers = [];
    self.panel_stcPowers = [];
    self.panel_crystalline_types = [];
    self.panel_frame_colors = [];
    self.panel_number_of_cells = [];

    // add panel model filter fields
    panelModels.forEach(function(panel) {
      if (self.panel_manufacturers.indexOf(panel.manufacturer) === -1) {
        self.panel_manufacturers.push(panel.manufacturer);
      }

      if (self.panel_stcPowers.indexOf(panel.stcPower) === -1) {
        self.panel_stcPowers.push(panel.stcPower);
      }

      if (self.panel_crystalline_types.indexOf(panel.crystallineType) === -1) {
        self.panel_crystalline_types.push(panel.crystallineType);
      }

      if (self.panel_frame_colors.indexOf(panel.frameColor) === -1) {
        self.panel_frame_colors.push(panel.frameColor);
      }

      if (self.panel_number_of_cells.indexOf(panel.numberOfCells) === -1) {
        self.panel_number_of_cells.push(panel.numberOfCells);
      }

      // iterate through all locations in locations array on panel
      self.panel_manufacturing_locations = panel.manufacturingLocations.reduce(function(arr, loc) {
        if (arr.indexOf(loc) === -1) {
          arr.push(loc);
        }

        return arr;
      }, self.panel_manufacturing_locations);
    });

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
    return Review.find({ organization: self._id, verified: true }, 'rating')
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

    return PriceReview.find({ organization: self._id, verified: true }, 'price quantity')
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
