'use strict';

/**
 * Module dependencies.
 */
var priceReviewsPolicy = require('../policies/pricereviews.server.policy'),
  priceReviews = require('../controllers/pricereviews.server.controller'),
  organizations = require('../../../../modules/organizations/server/controllers/organizations.server.controller');

module.exports = function (app) {
  // Reviews collection routes
  app.route('/api/pricereviews').all(priceReviewsPolicy.isAllowed)
    .get(priceReviews.list);

  // Create a new Price Review
  app.route('/api/pricereviews/create/:organizationId').all(priceReviewsPolicy.isAllowed)
    .post(priceReviews.create);

  // Single price review routes
  app.route('/api/pricereviews/:priceReviewId').all(priceReviewsPolicy.isAllowed)
    .get(priceReviews.read)
    .put(priceReviews.update)
    .delete(priceReviews.delete);

  // List of all price reviews for super admins
  app.route('/api/pricereviews-admin-list').all(priceReviewsPolicy.isAllowed)
    .get(priceReviews.admin_list);

  // Finish by binding the price review middleware
  app.param('priceReviewId', priceReviews.priceReviewByID);
  app.param('organizationId', organizations.organizationByID);
};
