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
    .get(reviews.list)
    .post(reviews.create);

  // Single review routes
  app.route('/api/reviews/:reviewId').all(reviewsPolicy.isAllowed)
    .get(reviews.read)
    .put(reviews.update)
    .delete(reviews.delete);

  // Finish by binding the review middleware
  app.param('reviewId', reviews.reviewByID);
  app.param('organizationId', organizations.organizationByID);
};
