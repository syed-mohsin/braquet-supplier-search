'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

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
  stcPowerW: {
  	type: Number
  },
  manufacturingLocations: {
  	type: String
  }
});

mongoose.model('PanelModel', PanelModelSchema);