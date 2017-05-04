'use strict';

/**
 * Module dependencies.
 */
var contactController = require('../controllers/contact.server.controller');

module.exports = function (app) {
  // send email based on contact form
  app.route('/api/contact').post(contactController.sendContactRequest);
};
