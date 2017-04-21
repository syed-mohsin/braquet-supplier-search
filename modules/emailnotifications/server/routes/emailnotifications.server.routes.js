'use strict';

/**
 * Module dependencies.
 */
var emailNotificationsPolicy = require('../policies/emailnotifications.server.policy'),
  emailNotifications = require('../controllers/emailnotifications.server.controller');

module.exports = function (app) {

  // EmailNotifications collection routes
  app.route('/api/emailnotifications').all(emailNotificationsPolicy.isAllowed)
    .post(emailNotifications.create);

  // Follow organization route
  app.route('/api/emailnotifications-follow/:organizationId').all(emailNotificationsPolicy.isAllowed)
    .get(emailNotifications.followOrganization);

  // Single emailNotification routes
  app.route('/api/emailnotifications/:emailNotificationId').all(emailNotificationsPolicy.isAllowed)
    .get(emailNotifications.read)
    .put(emailNotifications.update);

  // Finish by binding the emailNotification middleware
  app.param('emailNotificationId', emailNotifications.emailNotificationByID);
};
