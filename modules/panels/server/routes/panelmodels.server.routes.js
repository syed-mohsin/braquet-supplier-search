'use strict';

/**
 * Module dependencies.
 */
var panelmodels = require('../controllers/panelmodels.server.controller');


module.exports = function (app) {
  // projects collection routes
  app.route('/api/panelmodels')
    .get(panelmodels.searchByName);

  app.route('/api/panels/photo/:panelId').post(panelmodels.uploadPhoto);
};