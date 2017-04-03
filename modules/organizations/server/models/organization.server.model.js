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
  lessThan100KW_avg_price: {
    type: Currency,
    default: 0
  },
  lessThan1MW_avg_price: {
    type: Currency,
    default: 0
  },
  greaterThan1MW_avg_price: {
    type: Currency,
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
  lessThan100KW_prices: [{
    type: Currency
  }],
  lessThan1MW_prices: [{
    type: Currency
  }],
  greaterThan1MW_prices: [{
    type: Currency
  }],
  quantities: [{
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
    PriceReview = mongoose.model('PriceReview');

  // set number of panels
  this.panels_length = this.panel_models.length;

  // set reviews_length and avg_review and remove stale reviews
  var self = this;
  Review.find({ _id: { $in: self.reviews }, verified: true }, 'rating')
  .exec()
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

    // calculate new average review
    var lessThan100KW_priceReviews = priceReviews.filter(function(r) {
      return r.quantity === '0kW-100kW';
    });

    var lessThan1MW_priceReviews = priceReviews.filter(function(r) {
      return r.quantity === '101kW-1MW';
    });

    var greaterThan1MW_priceReviews = priceReviews.filter(function(r) {
      return r.quantity === '>1MW';
    });

    self.lessThan100KW_avg_price = lessThan100KW_priceReviews.reduce(function(a,b) {
      return a + b.price ;
    }, 0) / lessThan100KW_priceReviews.length || 0;

    self.lessThan1MW_avg_price = lessThan1MW_priceReviews.reduce(function(a,b) {
      return a + b.price ;
    }, 0) / lessThan1MW_priceReviews.length || 0;

    self.greaterThan1MW_avg_price = greaterThan1MW_priceReviews.reduce(function(a,b) {
      return a + b.price ;
    }, 0) / greaterThan1MW_priceReviews.length || 0;

    // store prices in appropriate array
    priceReviews.forEach(function(priceReview) {
      if (priceReview.quantity === '0kW-100kW' &&
        self.lessThan100KW_prices.indexOf(priceReview.price) === -1) {

        self.lessThan100KW_prices.push(priceReview.price);
      } else if (priceReview.quantity === '101kW-1MW' &&
        self.lessThan1MW_prices.indexOf(priceReview.price) === -1) {

        self.lessThan1MW_prices.push(priceReview.price);
      } else if (priceReview.quantity === '>1MW' &&
        self.greaterThan1MW_prices.indexOf(priceReview.price) === -1) {

        self.greaterThan1MW_prices.push(priceReview.price);
      }
    });

    // set quantities
    if (self.lessThan100KW_prices.length && self.quantities.indexOf('0kW-100kW') === -1) {
      self.quantities.push('0kW-100kW');
    }
    if (self.lessThan1MW_prices.length && self.quantities.indexOf('101kW-1MW') === -1) {
      self.quantities.push('101kW-1MW');
    }
    if (self.greaterThan1MW_prices.length && self.quantities.indexOf('>1MW') === -1) {
      self.quantities.push('>1MW');
    }

    // finish
    next();
  })
  .catch(function(err) {
    console.log('there was an error with org prehook saving', err);
    next();
  });
});

mongoose.model('Organization', OrganizationSchema);
