'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke EmailNotifications Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/emailnotifications',
      permissions: '*'
    }, {
      resources: '/api/emailnotifications/:emailNotificationId',
      permissions: '*'
    }, {
      resources: '/api/emailnotifications-follow/:organizationId',
      permissions: '*'
    }]
  }, {
    roles: ['user', 'seller'],
    allows: [{
      resources: '/api/emailnotifications',
      permissions: ['get']
    }, {
      resources: '/api/emailnotifications/:emailNotificationId',
      permissions: ['get']
    }, {
      resources: '/api/emailnotifications-follow/:organizationId',
      permissions: ['get']
    }, {
      resources: '/api/emailnotifications/get-my-notification',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If EmailNotifications Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // allow admin full access
  if (roles.indexOf('admin') !== -1) {
    return next();
  }

  // If an emailNotification is being processed and the
  // current user created it then allow any manipulation
  if (req.emailNotification && req.user && req.emailNotification.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
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
