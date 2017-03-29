'use strict';

/**
 * Module dependencies.
 */
var pricingReviewsPolicy = require('../policies/pricingreviews.server.policy'),
  pricingReviews = require('../controllers/pricingreviews.server.controller'),
  organizations = require('../../../../modules/organizations/server/controllers/organizations.server.controller');

module.exports = function (app) {
  // Reviews collection routes
  app.route('/api/pricingreviews').all(pricingReviewsPolicy.isAllowed)
    .get(pricingReviews.list);

  // Create a new Pricing Review
  app.route('/api/pricingreviews/create/:organizationId').all(pricingReviewsPolicy.isAllowed)
    .post(pricingReviews.create);

  // Single pricing review routes
  app.route('/api/pricingreviews/:pricingReviewId').all(pricingReviewsPolicy.isAllowed)
    .get(pricingReviews.read)
    .put(pricingReviews.update)
    .delete(pricingReviews.delete);

  // List of all pricing reviews for super admins
  app.route('/api/reviews-admin-list').all(pricingReviewsPolicy.isAllowed)
    .get(pricingReviews.admin_list);

  // Finish by binding the pricing review middleware
  app.param('pricingReviewId', pricingReviews.pricingReviewByID);
  app.param('organizationId', organizations.organizationByID);
};
