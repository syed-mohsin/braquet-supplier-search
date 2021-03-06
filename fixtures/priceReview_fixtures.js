'use strict';

var mongoose = require('mongoose');
var PriceReview = mongoose.model('PriceReview');

var currentOrgs;
var currentUsers;
var quantities = ['0kW-100kW', '101kW-500kW', '501kW-1MW', '>1MW'];
var panelTypes = ['Poly', 'Mono', 'other'];
var shippingLocations = ['Asia/Australia', 'Africa', 'Europe', 'North America', 'South America'];

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
  var priceReviews = [];

  currentOrgs.forEach(function(org) {
    var randomNumberOfPriceReviews = Math.floor(Math.random() * 500) + 500;

    for(var i=0; i<randomNumberOfPriceReviews; i++) {
      priceReviews.push(createPriceReview(org));
    }
  });

  return priceReviews.map(function(price_review) {
    return price_review.save();
  });
};

var updateOrganizationsAfterPriceReviewsCreation = function(currOrgs) {
  return currOrgs.map(function(org) {
    return org.save();
  });
};

module.exports = {
  'generateMockPriceReviewData': generateMockPriceReviewData,
  'updateOrganizations': updateOrganizationsAfterPriceReviewsCreation
};