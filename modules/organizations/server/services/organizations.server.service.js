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

exports.extractBrands = function(organizations) {
  return organizations.map(function(org) {
    // group all price reviews by brand
    org.brands = _.groupBy(org.priceReviews, function(priceReview) {
      return priceReview.manufacturer + '#' + priceReview.panelType;
    });

    // calcuate median of all price reviews under a brand
    org.brands = _.mapObject(org.brands, function(brand) {
      brand.sort(function (a, b) { return a.price - b.price; });
      var lowMiddle = Math.floor((brand.length - 1) / 2);
      var highMiddle = Math.ceil((brand.length - 1) / 2);
      var median = (brand[lowMiddle].price + brand[highMiddle].price) / 2;
      return median;
    });

    // calculate for each type of panel
    var price_sum_mono = 0;
    var price_sum_poly = 0;
    var brands_length_mono = 0;
    var brands_length_poly = 0;
    for (var key in org.brands) {
      if (key.split('#')[1] === 'Mono') {
        price_sum_mono += org.brands[key];
        ++brands_length_mono;
      } else {
        price_sum_poly += org.brands[key];
        ++brands_length_poly;
      }
    }

    // calcuate average for each panel type across brands
    org.brands_avg_mono = price_sum_mono / brands_length_mono;
    org.brands_avg_poly = price_sum_poly / brands_length_poly;
    return org;
  });
};

exports.sortByQuery = function(orgs, query) {
  // build query for crystalline types
  if (query.crys &&
      query.crys.indexOf('Mono') !== -1 &&
      query.crys.indexOf('Poly') === -1) { // sort by mono
    orgs.sort(function(a,b) {
      if(!isFinite(a.brands_avg_mono-b.brands_avg_mono)) {
        return !isFinite(a.brands_avg_mono) ? 1 : -1;
      } else {
        return a.brands_avg_mono - b.brands_avg_mono ||
          a.brands_avg_poly - b.brands_avg_poly ||
          b.reviews_length - a.reviews_length;
      }
    });
  } else { // sort by poly
    orgs.sort(function(a,b) {
      if(!isFinite(a.brands_avg_poly-b.brands_avg_poly)) {
        return !isFinite(a.brands_avg_poly) ? 1 : -1;
      } else {
        return a.brands_avg_poly - b.brands_avg_poly ||
          a.brands_avg_mono - b.brands_avg_mono ||
          b.reviews_length - a.reviews_length;
      }
    });
  }

  return orgs;
};
