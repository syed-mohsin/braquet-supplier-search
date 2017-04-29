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

  // Mailgun Webhook routes
  app.route('/api/emailnotifications/unsubscribe/:token')
    .get(emailNotifications.unsubscribe);

  // get current user's email notification settings
  app.route('/api/emailnotifications/get-my-notification').all(emailNotificationsPolicy.isAllowed)
    .get(emailNotifications.getUserEmailNotification);

  // Single emailNotification routes
  app.route('/api/emailnotifications/:emailNotificationId').all(emailNotificationsPolicy.isAllowed)
    .get(emailNotifications.read)
    .put(emailNotifications.update);

  // Follow organization route
  app.route('/api/emailnotifications-follow/:organizationId').all(emailNotificationsPolicy.isAllowed)
    .get(emailNotifications.followOrganization);

  // Finish by binding the emailNotification middleware
  app.param('emailNotificationId', emailNotifications.emailNotificationByID);
};
