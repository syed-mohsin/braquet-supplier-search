'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

mongoose.connect('mongodb://f615e0a2-eb3c-43ef-ae60-96a42339ec2c:06851da9-1b8d-4136-8748-dee37ed578b0@ds145019.mlab.com:45019/braquet-db');
// mongoose.connect('mongodb://localhost/mean-dev');

// register modules
require('../modules/organizations/server/models/organization.server.model');
require('../modules/panels/server/models/panelmodel.server.model');


var PanelModel = mongoose.model('PanelModel'),
  Organization = mongoose.model('Organization');


Organization.find()
.populate('panel_models')
.exec()
.then(function(orgs) {
  var orgPromises = orgs.map(function(org) {
    org.panel_models.forEach(function(panel) {
      if (org.panel_manufacturers.indexOf(panel.manufacturer) === -1) {
        org.panel_manufacturers.push(panel.manufacturer);
      }

      if (org.panel_stcPowers.indexOf(panel.stcPower) === -1) {
        org.panel_stcPowers.push(panel.stcPower);
      }

      if (org.panel_crystalline_types.indexOf(panel.crystallineType) === -1) {
        org.panel_crystalline_types.push(panel.crystallineType);
      }

      if (org.panel_frame_colors.indexOf(panel.frameColor) === -1) {
        org.panel_frame_colors.push(panel.frameColor);
      }

      if (org.panel_number_of_cells.indexOf(panel.numberOfCells) === -1) {
        org.panel_number_of_cells.push(panel.numberOfCells);
      }
    });

    return org.save();
  });

  return Promise.all(orgPromises);
})
.then(function(savedOrgs) {
  console.log(savedOrgs.length, 'org filter fields updated');
})
.catch(function(err) {
  console.log('ERR', err);
});
