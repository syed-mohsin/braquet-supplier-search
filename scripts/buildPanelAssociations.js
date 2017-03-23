'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// mongoose.connect(process.env.MONGO_PRODUCTION_CONNECTION_URL);
mongoose.connect('mongodb://localhost/mean-dev');

// register modules
require('../modules/organizations/server/models/organization.server.model');
require('../modules/panels/server/models/panelmodel.server.model');


var PanelModel = mongoose.model('PanelModel'),
  Organization = mongoose.model('Organization');

// begin panelmodel -> organization association
var errCount = 0;
// PanelModel.find()
//   .then(function(panels) {
//     console.log(panels.length);
//     panels.forEach(function(panel) {
//       Organization.find({companyName: new RegExp(panel.manufacturer, 'i')})
//         .exec()
//         .then(function(orgs) {
//           if (!orgs.length) {
//             errCount++;
//             console.log(panel.manufacturer);
//           }
//
//           console.log(panel.manufacturer, orgs.length);
//           var promises = orgs.map(function(org) {
//             if (!org.panel_models.some((orgPanelId) => orgPanelId.equals(panel._id))) {
//               org.panel_models.push(panel._id);
//             }
//
//             // add items for filtering purposes
//             if (org.panel_manufacturers.indexOf(panel.manufacturer) === -1) org.panel_manufacturers.push(panel.manufacturer);
//             if (org.panel_stcPowers.indexOf(panel.stcPower) === -1) org.panel_stcPowers.push(panel.stcPower);
//             if (org.panel_crystalline_types.indexOf(panel.crystallineType) === -1) org.panel_crystalline_types.push(panel.crystallineType);
//             if (org.panel_frame_colors.indexOf(panel.frameColor) === -1) org.panel_frame_colors.push(panel.frameColor);
//             if (org.panel_number_of_cells.indexOf(panel.numberOfCells) === -1) org.panel_number_of_cells.push(panel.numberOfCells);
//
//             return org.save();
//           });
//
//           return Promise.all(promises);
//         })
//         .then(function(savedOrgs) {
//           console.log("SAVED ", savedOrgs.length, "ORGS");
//         })
//         .catch(function(err) {
//           console.log(err);
//         });
//     });
//   });

Organization.find()
  .then(function(orgs) {
    console.log(orgs.length);
    var promises = orgs.map(function(org) {
      org.panel_manufacturers = org.panel_manufacturers.filter((item, i, arr) => arr.indexOf(item) === i);
      org.panel_stcPowers = org.panel_stcPowers.filter((item, i, arr) => arr.indexOf(item) === i);
      org.panel_crystalline_types = org.panel_crystalline_types.filter((item, i, arr) => arr.indexOf(item) === i);
      org.panel_frame_colors = org.panel_frame_colors.filter((item, i, arr) => arr.indexOf(item) === i);
      org.panel_number_of_cells = org.panel_number_of_cells.filter((item, i, arr) => arr.indexOf(item) === i);

      return org.save();
    });

    return Promise.all(promises);
  })
  .then(function(savedOrgs) {
    console.log(savedOrgs.length, 'orgs saved');
  })
  .catch(function(err) {
    console.log(err);
  });
