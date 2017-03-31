'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Price Review Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/pricereviews',
      permissions: '*'
    }, {
      resources: '/api/pricereviews/create/:organizationId',
      permissions: ['post']
    }, {
      resources: '/api/pricereviews/:priceReviewId',
      permissions: '*'
    }, {
      resources: '/api/pricereviews-admin-list',
      permissions: 'get'
    }]
  }, {
    roles: ['user', 'seller'],
    allows: [{
      resources: '/api/pricereviews',
      permissions: ['get']
    }, {
      resources: '/api/pricereviews/create/:organizationId',
      permissions: ['post']
    }, {
      resources: '/api/pricereviews/:priceReviewId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If pricereviews Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // if admin, allow any manipulation
  if (req.user.roles.indexOf('admin') !== -1) {
    return next();
  }

  // prevent non-authorized user from seeing unowned view
  if (req.route.path === '/api/pricereviews/:priceReviewId' && req.priceReview && req.user && req.priceReview.user.id !== req.user.id) {
    return res.status(403).json({
      message: 'User is not authorized'
    });
  }

  // If a pricereview is being processed and the current user created it then allow any manipulation
  // (except for edit)
  if (req.priceReview && req.user && req.priceReview.user.id === req.user.id && req.route.path === '/api/pricereviews/:priceReviewId' && req.method !== 'PUT') {
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
