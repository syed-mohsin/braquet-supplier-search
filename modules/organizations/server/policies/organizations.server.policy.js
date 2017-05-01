'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Organizations Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/organizations',
      permissions: '*'
    }, {
      resources: '/api/organizations/:organizationId',
      permissions: '*'
    }, {
      resources: '/api/organizations/:organizationId/verify',
      permissions: ['post']
    }, {
      resources: '/api/organizations-unverified',
      permissions: ['get']
    }, {
      resources: '/api/organizations/:organizationId/addUsers',
      permissions: ['post']
    }, {
      resources: '/api/organizations-set-admin',
      permissions: ['get']
    }, {
      resources: '/api/organizations/logo/:organizationId',
      permissions: ['post']
    }]
  }, {
    roles: ['user', 'seller'],
    allows: [{
      resources: '/api/organizations',
      permissions: ['get', 'post']
    }, {
      resources: '/api/organization-requests',
      permissions: ['get']
    }, {
      resources: '/api/organization-auth/accept-invite',
      permissions: ['post']
    }, {
      resources: '/api/organizations/:organizationId',
      permissions: ['get', 'put', 'post']
    }, {
      resources: '/api/organizations/logo/:organizationId',
      permissions: ['post']
    }, {
      resources: '/api/organization-auth/send-invite',
      permissions: ['post']
    }, {
      resources: '/api/organizations/:organizationId/contact',
      permissions: ['post']
    }]
  }]);
};

/**
 * Check If Organizations Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an organization is being processed and the current user created it then allow any manipulation
  // if (req.organization && req.user && req.organization.user.id === req.user.id) {
  //   return next();
  // }

  // allow organization admin to access adding employees to organization
  if (req.route.path === '/api/organizations/:organizationId/addUsers' && (req.user._id.equals(req.organization.admin))) {
    return next();
  }

  // allow organization admin to access emp
  if (req.route.path === '/api/organizations/:organizationId/edit' && (req.user._id.equals(req.organization.admin))) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else if (req.organization && !req.organization.verified && req.user.roles.indexOf('admin') === -1) {
      return res.status(403).json({
        message: 'User is not authorized'
      });
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
