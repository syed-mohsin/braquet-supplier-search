'use strict';

var mongoose = require('mongoose');
var Organization = mongoose.model('Organization');
var User = mongoose.model('User');
var Review = mongoose.model('Review');

var potentialReviewTitles = ['This organization is great.', 'This is organization is ok.', 'This is organization is mediocre.', 'This is organization is bad.', 'This is organization is absolutely terrible.'];
var potentialReviewContents = ['Experience buying from them', 'Dealt with customer service', 'Connected them with other clients', 'Visited them onsite', 'Have reviewed their financials'];
var potentialCategories = ['Currently doing business with company','Have done business with company','Discussed business with company','General','Other'];
var currentOrgs;
var currentUsers;

var createReview = function() {
  var review = {};
  var randomReviewandRatingNumber = Math.floor(Math.random() * 4);
  review['title'] = potentialReviewTitles[randomReviewandRatingNumber];
  review['rating'] = randomReviewandRatingNumber + 1;
  review['content'] = potentialReviewContents[randomReviewandRatingNumber];
  review['category'] = potentialCategories[randomReviewandRatingNumber];
  review['organization'] = currentOrgs[Math.floor(Math.random() * (currentOrgs.length - 1))]['_id'];
  review['user'] = currentUsers[Math.floor(Math.random() * (currentUsers.length - 1))]['_id'];
  return new Review(review);
};



var generateMockReviewData = function(numberOfReviews, currOrgs, currUsers) {
  currentOrgs = currOrgs;
  currentUsers = currUsers;
  var mongooseReviews = [];

  for(var i=0; i<numberOfReviews; i++) {
    var reviewCreation = createReview();
    if(reviewCreation) {
      mongooseReviews.push(reviewCreation);
    }
  }
  
  var promises = mongooseReviews.map(function(review) {
    return review.save();
  });

  return promises;
};

var clearReviewData = function() {
  return Review.remove({}).exec();
};

var gatherCurrentOrgData = function() {
  return Organization.find().exec();
};

var gatherCurrentUserData = function() {
  return User.find().exec();
};


module.exports = {
  'clearReviewData': clearReviewData,
  'gatherCurrentOrgData': gatherCurrentOrgData,
  'gatherCurrentUserData': gatherCurrentUserData,
  'generateMockReviewData': generateMockReviewData
};
