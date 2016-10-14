'use strict';

/**
 * Module dependencies.
 */
var bidsPolicy = require('../policies/bids.server.policy'),
  projects = require('../../../projects/server/controllers/projects.server.controller'),
  bids = require('../controllers/bids.server.controller');

module.exports = function (app) {
  // bids collection routes
  app.route('/api/bids').all(bidsPolicy.isAllowed)
    .get(bids.list)
    .post(bids.create);

  // Single bid routes
  app.route('/api/bids/:bidId').all(bidsPolicy.isAllowed)
    .get(bids.read)
    .delete(bids.delete);

  // Finish by binding the bid+project middleware
  app.param('bidId', bids.bidByID);
};