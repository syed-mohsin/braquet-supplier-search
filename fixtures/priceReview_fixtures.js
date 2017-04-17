// get all users
// get all orgs 
// fill in price reveiew organization and user
// grab the panel manufacturer off of the org panel manufacturer array and place this as the price review manufacturer

// quote date should be in the past
// delivery date should be anytime after quote date
// stc power should be between 0-500
// price can be anything between 0-200
// manufacturer is something in the orgs manufacturer array
// Each company should have 500-1000 price reviews; one-to-one mapping so no 2 companies should have share the same price review
// Need to place newly created price review on the org; once done you need to update all of the orgs

'use strict';

var mongoose = require('mongoose');
var PriceReview = mongoose.model('PriceReview');

var currentOrgs;
var currentUsers;
var quantities = ['0kW-100kW', '101kW-500kW', '501kW-1MW', '>1MW'];
var panelTypes = ['Poly', 'Mono', 'other'];
var shippingLocations = ['Asia/Australia', 'Africa', 'Europe', 'North America', 'South America'];


var clearPriceReviewData = function() {
  return PriceReview.remove({}).exec();
};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

var createPriceReview = function(currentOrganization) {
  var priceReview = {};

  priceReview['quoteDate'] = randomDate(new Date('2016-07-30'), new Date()); // generate a random quote date after '2016-07-30'
  priceReview['deliveryDate'] = randomDate(priceReview['quoteDate'], new Date()); // generate a random delivery date after quote date
  priceReview['stcPower'] = Math.floor(Math.random() * 500);
  priceReview['price'] = Math.floor(Math.random() * 200);
  priceReview['manufacturer'] = currentOrganization['panel_manufacturers'][Math.floor(Math.random() * currentOrganization['panel_manufacturers'].length)];
  priceReview['quantity'] = quantities[Math.floor(Math.random() * quantities.length)];
  priceReview['panelType'] = panelTypes[Math.floor(Math.random() * panelTypes.length)];
  priceReview['includesShipping'] = true;
  priceReview['shippingLocations'] = shippingLocations[Math.floor(Math.random() * shippingLocations.length)];
  priceReview['user'] = currentUsers[Math.floor(Math.random() * currentUsers.length)]._id;
  priceReview['organization'] = currentOrganization._id;

  return new PriceReview(priceReview);
};

var generateMockPriceReviewData = function(currOrgs, currUsers) {
  currentOrgs = currOrgs;
  currentUsers = currUsers;
  var mongoosePriceReviews = [];

  currentOrgs.forEach(function(org) {
    var randomNumberOfPriceReviews = Math.floor(Math.random() * 500) + 500;

    for(var i=0; i<randomNumberOfPriceReviews; i++) {
      mongoosePriceReviews.push(createPriceReview(org));
    }
  });

  var promises = mongoosePriceReviews.map(function(price_review) {
    return price_review.save();
  });

  return promises;
};

var updateOrganizationsAfterPriceReviewsCreation = function(currOrgs) {
  var promises = [];

  currOrgs.forEach(function(org) {
    PriceReview.find({ organization: org._id }).exec()
      .then(function(priceReviewsForOrg) {
        priceReviewsForOrg.forEach(function(priceRev) {
          org.priceReviews.push(priceRev._id);
        });
        promises.push(org.save());
      })
  });

  return promises;
};






module.exports = {
  'clearPriceReviewData': clearPriceReviewData,
  'generateMockPriceReviewData': generateMockPriceReviewData,
  'updateOrganizations': updateOrganizationsAfterPriceReviewsCreation
};