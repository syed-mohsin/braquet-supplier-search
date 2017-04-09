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

  // for catalog
  app.route('/api/organizations-catalog')
    .get(organizations.get_catalog);

  // for signup page
  app.route('/api/organizations-basic')
    .get(organizations.list_basic);

  // admin-only view of unverified projects
  app.route('/api/organizations-unverified').all(organizationsPolicy.isAllowed)
    .get(organizations.list_unverified);

  // contact supplier route
  app.route('/api/organizations/:organizationId/contact').all(organizationsPolicy.isAllowed)
    .post(organizations.contact);

  // admin verify route
  app.route('/api/organizations/:organizationId/verify').all(organizationsPolicy.isAllowed)
    .post(organizations.verify);

  // admin set admin for organizationId
  app.route('/api/organizations-set-admin').all(organizationsPolicy.isAllowed)
    .post(organizations.setOrganizationAdmin);

  // view single organization is allowed for public access
  app.route('/api/organizations/:organizationId/public')
    .get(organizations.readPublic);

  // Single organization routes (all require user-authentication)
  app.route('/api/organizations/:organizationId').all(organizationsPolicy.isAllowed)
    .get(organizations.read)
    .put(organizations.update);

  app.route('/api/organizations/logo/:organizationId').all(organizationsPolicy.isAllowed)
    .post(organizations.changeLogo);

  app.route('/api/organizations/:organizationId/addUsers').all(organizationsPolicy.isAllowed)
    .post(organizations.addUsers);


  // Finish by binding the organization middleware
  app.param('organizationId', organizations.organizationByID);
};
