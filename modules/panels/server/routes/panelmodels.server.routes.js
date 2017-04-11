'use strict';

/**
 * Module dependencies.
 */
var panelmodels = require('../controllers/panelmodels.server.controller');
var panelmodelsPolicy = require('../policies/panelmodels.server.policy');


module.exports = function (app) {
  // projects collection routes
  app.route('/api/panelmodels').all(panelmodelsPolicy.isAllowed)
    .get(panelmodels.searchByName);

  app.route('/api/panelmodels/:panelId').all(panelmodelsPolicy.isAllowed)
   	.get(panelmodels.read);

  app.route('/api/panels/photo/:panelId').all(panelmodelsPolicy.isAllowed)
  	.post(panelmodels.uploadPhoto);

  app.route('/api/panelmodels-filters')
    .get(panelmodels.getFilters);

  app.route('/api/panelmodels-wattages')
    .get(panelmodels.getWattageValues);

  // Finish by binding the panelmodel middleware
  app.param('panelId', panelmodels.panelmodelByID);
};
