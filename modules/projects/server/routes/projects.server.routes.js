'use strict';

/**
 * Module dependencies.
 */
var projectsPolicy = require('../policies/projects.server.policy'),
  projects = require('../controllers/projects.server.controller'),
  bids = require('../../../bids/server/controllers/bids.server.controller');

module.exports = function (app) {
  // projects collection routes
  app.route('/api/projects').all(projectsPolicy.isAllowed)
    .get(projects.list)
    .post(projects.create);

  // store a bid associated with a projectId
  app.route('/api/projects/storebid/:projectId/:bidId').all(projectsPolicy.isAllowed)
    .put(projects.storeBid);

  // store invited users
  app.route('/api/projects/:projectId/inviteBidders').all(projectsPolicy.isAllowed)
    .post(projects.inviteBidders);

  // get bids associated with project
  app.route('/api/projects/getbids/:projectId').all(projectsPolicy.isAllowed)
    .get(projects.projectBids);

  // Single project routes
  app.route('/api/projects/:projectId').all(projectsPolicy.isAllowed)
    .get(projects.read)
    .put(projects.update)
    .delete(projects.delete);

  // Finish by binding the project middleware
  app.param('projectId', projects.projectByID);
  app.param('bidId', bids.bidByID);
};