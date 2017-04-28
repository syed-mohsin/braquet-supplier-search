'use strict';

/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Contact Organization Schema
 */
var ContactOrganizationSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  projectRole: {
    type: String,
    enum: ['Installer', 'EPC', 'Developer', 'Other']
  },
  preferredModuleWattage: {
    type: Number,
    required: 'Preferred module wattage is required'
  },
  quantity: {
    type: String,
    enum: ['0kW-100kW', '101kW-500kW', '501kW-1MW', '>1MW'],
    required: 'Please specify a quantity'
  },
  deliveryDate: {
    type: Date,
    required: 'Delivery date is required.'
  },
  shippingAddress: {
    address1: {
      type: String
    },
    address2: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    zipcode: {
      type: String
    },
    country: {
      type: String
    },
  }
});

mongoose.model('ContactOrganization', ContactOrganizationSchema);
