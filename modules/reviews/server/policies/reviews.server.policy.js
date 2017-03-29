'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Reviews Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/reviews',
      permissions: '*'
    }, {
      resources: '/api/reviews/create/:organizationId',
      permissions: ['post']
    }, {
      resources: '/api/reviews/:reviewId',
      permissions: '*'
    }, {
      resources: '/api/reviews-admin-list',
      permissions: 'get'
    }]
  }, {
    roles: ['user', 'seller'],
    allows: [{
      resources: '/api/reviews',
      permissions: ['get']
    }, {
      resources: '/api/reviews/create/:organizationId',
      permissions: ['post']
    }, {
      resources: '/api/reviews/is-reviewed',
      permissions: ['get']
    }, {
      resources: '/api/reviews/:reviewId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Reviews Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // if admin, allow any manipulation
  if (req.user.roles.indexOf('admin') !== -1) {
    return next();
  }

  // prevent non-authorized user from seeing unowned view
  if (req.route.path === '/api/reviews/:reviewId' && req.review && req.user && req.review.user.id !== req.user.id) {
    return res.status(403).json({
      message: 'User is not authorized'
    });
  }

  // If a review is being processed and the current user created it then allow any manipulation
  // (except for edit)
  if (req.review && req.user && req.review.user.id === req.user.id && req.route.path === '/api/reviews/:reviewId' && req.method !== 'PUT') {
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
