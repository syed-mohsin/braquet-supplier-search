'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  mongoose = require('mongoose'),
  Organization = mongoose.model('Organization'),
  Review = mongoose.model('Review'),
  PriceReview = mongoose.model('PriceReview'),
  PanelModel = mongoose.model('PanelModel'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto'),
  aws = require('aws-sdk'),
  s3 = new aws.S3(),
  _ = require('underscore');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

exports.cachePanelFields = function(organization, panelModels) {
  // reset panel filtering fields
  organization.panel_manufacturers = [];
  organization.panel_stcPowers = [];
  organization.panel_crystalline_types = [];
  organization.panel_frame_colors = [];
  organization.panel_number_of_cells = [];

  // add panel model filter fields
  panelModels.forEach(function(panel) {
    if (organization.panel_manufacturers.indexOf(panel.manufacturer) === -1) {
      organization.panel_manufacturers.push(panel.manufacturer);
    }

    if (organization.panel_stcPowers.indexOf(panel.stcPower) === -1) {
      organization.panel_stcPowers.push(panel.stcPower);
    }

    if (organization.panel_crystalline_types.indexOf(panel.crystallineType) === -1) {
      organization.panel_crystalline_types.push(panel.crystallineType);
    }

    if (organization.panel_frame_colors.indexOf(panel.frameColor) === -1) {
      organization.panel_frame_colors.push(panel.frameColor);
    }

    if (organization.panel_number_of_cells.indexOf(panel.numberOfCells) === -1) {
      organization.panel_number_of_cells.push(panel.numberOfCells);
    }
  });

  return organization;
};

exports.processQuery = function(query) {
  var result = [];
  var organizationQueryParams = {}; // query object for Organization
  var priceReviewQueryParams = {}; // query object for Price Review
  organizationQueryParams.verified = true; // get only verified organizations
  organizationQueryParams.panels_length = { '$gt': 0 }; // only show suppliers with any panel models

  // check for filtering for manufacturers and/or resellers
  if (query.isman === 'true' && query.isreseller !== 'true') {
    organizationQueryParams.isManufacturer = true;
  } else if (query.isman !=='true' && query.isreseller === 'true') {
    organizationQueryParams.isManufacturer = false;
  }

  // build query for search using regular expression
  if (query.q) {
    organizationQueryParams.companyName = new RegExp(query.q, 'i');
  }

  // build query for manufacturers
  if (query.man) {
    var manCondition = query.man.split('|').filter(function(m) { return m.length !== 0; });
    organizationQueryParams.panel_manufacturers = { '$in' :  manCondition };
  }

  // build query for crystalline types
  if (query.crys) {
    var crysCondition = query.crys.split('|').filter(function(c) { return c.length !== 0; });
    organizationQueryParams.panel_crystalline_types = { '$in' :  crysCondition };
  }

  // build query for frame colors
  if (query.color) {
    var colorCondition = query.color.split('|').filter(function(c) { return c.length !== 0; });
    organizationQueryParams.panel_frame_colors = { '$in' :  colorCondition };
  }

  // build query for number of cells
  if (query.cells) {
    var cellsCondition = query.cells.split('|').filter(function(m) { return m.length !== 0; });
    organizationQueryParams.panel_number_of_cells = { '$in' :  cellsCondition };
  }

  // build query for wattage filter
  if (query.pow) {
    // or statement to check all wattage ranges passed in
    var powerArr = query.pow.split('|').filter(function(p) { return p.length !== 0 && !isNaN(p); });
    organizationQueryParams.$or = powerArr.map(function(pow) {
      return {
        'panel_stcPowers':
        {
          '$elemMatch':
          {
            '$gt': parseInt(pow)-100,
            '$lte': parseInt(pow)
          }
        }
      };
    });
  }

  // build query for quantity
  priceReviewQueryParams.quantity = query.quantity || '0kW-100kW';

  return {
    organizationQueryParams: organizationQueryParams,
    priceReviewQueryParams: priceReviewQueryParams
  };
};
