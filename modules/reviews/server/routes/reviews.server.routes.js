'use strict';

/**
 * Module dependencies.
 */
var reviewsPolicy = require('../policies/reviews.server.policy'),
  reviews = require('../controllers/reviews.server.controller'),
  organizations = require('../../../../modules/organizations/server/controllers/organizations.server.controller');

module.exports = function (app) {
  // Reviews collection routes
  app.route('/api/reviews').all(reviewsPolicy.isAllowed)
    .get(reviews.list);

  // Create a new Review
  app.route('/api/reviews/create/:organizationId').all(reviewsPolicy.isAllowed)
    .post(reviews.create);

  // Route to see if review exists from user for organization
  app.route('/api/reviews/is-reviewed').all(reviewsPolicy.isAllowed)
    .get(reviews.isReviewed);

  // Single review routes
  app.route('/api/reviews/:reviewId').all(reviewsPolicy.isAllowed)
    .get(reviews.read)
    .put(reviews.update)
    .delete(reviews.delete);

  // List of all reviews for super admins
  app.route('/api/reviews-admin-list').all(reviewsPolicy.isAllowed)
    .get(reviews.admin_list);

  // Finish by binding the review middleware
  app.param('reviewId', reviews.reviewByID);
  app.param('organizationId', organizations.organizationByID);
};
