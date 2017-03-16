'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// Update to ES6 Promises
mongoose.Promise = global.Promise;

/**
 * Panel Model Schema
 */
var PanelModelSchema = new Schema({
  manufacturer: {
    type: String
  },
  model: {
    type: String
  },
  technologyType: {
    type: String
  },
  stcModuleEfficiency: {
    type: String
  },
  crystallineType: {
    type: String
  },
  stcPower: {
    type: Number
  },
  frameColor: {
    type: String
  },
  numberOfCells: {
    type: Number
  },
  manufacturingLocations: [{
    type: String
  }],
  specSheetLink: {
    type: String
  },
  panelPhotoUrl: {
    type: String,
    default: 'https://www.oremonte.org/wp-content/uploads/t/t-sunpower-solar-panels-ebay-sunpower-solar-panels-for-sale-sunpower-solar-panels-for-boats-sunpower-solar-panels-for-rv-sunpower-solar-panels-financing-sunpower-solar-panels-for-marine-use-sunp.jpg'
  }
});

mongoose.model('PanelModel', PanelModelSchema);
