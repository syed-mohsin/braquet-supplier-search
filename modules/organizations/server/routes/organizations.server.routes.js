'use strict';

/**
 * Module dependencies.
 */
var organizationsPolicy = require('../policies/organizations.server.policy'),
  organizations = require('../controllers/organizations.server.controller');

module.exports = function (app) {
  // organizations collection routes
  app.route('/api/organizations').all(organizationsPolicy.isAllowed)
    .get(organizations.list)
    .post(organizations.create);

  // Single organization routes
  app.route('/api/organizations/:organizationId').all(organizationsPolicy.isAllowed)
    .get(organizations.read)
    // .put(organizations.update)
    .delete(organizations.delete);

  app.route('/api/organizations/logo/:organizationId').post(organizations.changeLogo);
  app.route('/api/organizations/:organizationId/addUsers').post(organizations.addUsers);
  app.route('/api/organizations/:organizationId/getPotentialUsers').get(organizations.getPotentialUsers);

  // Finish by binding the organization middleware
  app.param('organizationId', organizations.organizationByID);
};