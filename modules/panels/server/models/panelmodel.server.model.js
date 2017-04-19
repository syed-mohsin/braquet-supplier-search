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
  created: {
    type: Date,
    default: Date.now
  },
  manufacturer: {
    type: String
  },
  sellers: [{
    type: Schema.ObjectId,
    ref: 'Organization'
  }],
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
    default: 'modules/core/client/img/asset/generic-module.jpg'
  }
});

mongoose.model('PanelModel', PanelModelSchema);
