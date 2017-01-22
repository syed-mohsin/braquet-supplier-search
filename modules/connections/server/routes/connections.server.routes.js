'use strict';

/**
 * Module dependencies.
 */
var connectionsPolicy = require('../policies/connections.server.policy'),
  connections = require('../controllers/connections.server.controller');

module.exports = function (app) {
  // connections collection routes
  app.route('/api/connections').all(connectionsPolicy.isAllowed)
    .get(connections.list);

  // Single connection routes
  app.route('/api/connections/:connectionId').all(connectionsPolicy.isAllowed)
    .get(connections.read)
    // .put(connections.update)
    .delete(connections.delete);

  app.route('/api/connection-auth/send-invite').all(connectionsPolicy.isAllowed)
    .post(connections.inviteByEmail);

  app.route('/api/connection-auth/respond-invite/:inviteToken')
    .get(connections.signupByInviteAndConnect);

  // Finish by binding the connection middleware
  app.param('connectionId', connections.connectionByID);
};