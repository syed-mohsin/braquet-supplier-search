'use strict';

/**
 * Module dependencies.
 */
var organizationsPolicy = require('../policies/organizations.server.policy'),
  organizations = require('../controllers/organizations.server.controller');

module.exports = function (app) {
  // organizations collection routes
  app.route('/api/organizations').all(organizationsPolicy.isAllowed)
    .get(organizations.list);

  // get organization requests
  app.route('/api/organization-requests').all(organizationsPolicy.isAllowed)
    .get(organizations.listOrganizationRequests);

  // accept received organization request
  app.route('/api/organization-auth/accept-invite').all(organizationsPolicy.isAllowed)
    .post(organizations.acceptUserInvite);

  // Single organization routes
  app.route('/api/organizations/:organizationId').all(organizationsPolicy.isAllowed)
    .get(organizations.read)
    // .put(organizations.update)
    .delete(organizations.delete);

  app.route('/api/organization-auth/send-invite').all(organizationsPolicy.isAllowed)
    .post(organizations.inviteByEmail);

  app.route('/api/organization-auth/respond-invite/:inviteToken')
    .get(organizations.signupByInviteAndConnect);

  // Finish by binding the organization middleware
  app.param('organizationId', organizations.organizationByID);
};