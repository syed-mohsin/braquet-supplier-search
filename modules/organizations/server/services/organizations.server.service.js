'use strict';

/**
 * Module dependencies.
 */
var _ = require('underscore');

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

exports.calculateBrandsAveragePrice = function(org, query) {
  var sums = {};
  var lengths = {};
  var averages = {};

  // the organization already has only prices of type query.quantity
  // therefore, we can use the key query.quantity

  for (var brandKey in org.brands) {

    for (var panelTypeKey in org.brands[brandKey]) {
      if (sums[panelTypeKey]) {
        sums[panelTypeKey] += org.brands[brandKey][panelTypeKey][query.quantity];
        lengths[panelTypeKey] += 1;
      } else {
        sums[panelTypeKey] = org.brands[brandKey][panelTypeKey][query.quantity];
        lengths[panelTypeKey] = 1;
      }
    }

  }

  // store averages for panel prices across brands
  for (var panelKey in sums) {
    averages[panelKey] = sums[panelKey] / lengths[panelKey] || Infinity;
  }

  org.averages = averages;
  var averagesArray = Object.keys(averages).map(function(key) {
    return averages[key];
  });

  console.log('averages', averages);
  console.log('averages array', averagesArray);

  // calcuate average for each panel type across brands
  org.brands_avg_min = Math.min.apply(this, averagesArray);

  return org;
};

exports.extractBrands = function(organizations, query) {
  return organizations.map(function(org) {
    // group all price reviews by brand
    org.brands = _.groupBy(org.priceReviews, function(priceReview) {
      return priceReview.manufacturer + '#' + priceReview.panelType;
    });

    org.brands = _.chain(org.priceReviews)
      .groupBy(function(priceReview) {
        return priceReview.manufacturer;
      })
      .mapObject(function(brandPrices) {
        return _.chain(brandPrices)
          .groupBy(function(priceReview) {
            return priceReview.panelType;
          })
          .mapObject(function(panelPrices) {
            return _.groupBy(panelPrices, function(priceReview) {
              return priceReview.quantity;
            });
          })
          .value();
      })
      .mapObject(function(brand) {
        return _.mapObject(brand, function(panel) {
          return _.mapObject(panel, function(pricesByQuantity) {
            pricesByQuantity.sort(function (a, b) { return a.price - b.price; });
            var lowMiddle = Math.floor((pricesByQuantity.length - 1) / 2);
            var highMiddle = Math.ceil((pricesByQuantity.length - 1) / 2);
            var median = (pricesByQuantity[lowMiddle].price + pricesByQuantity[highMiddle].price) / 2;
            return median;
          });
        });
      })
      .value();

    console.log('brands', org.brands);

    // calculate average for each type of panel
    org = exports.calculateBrandsAveragePrice(org, query);

    return org;
  });
};

exports.sortByQuery = function(orgs, query) {
  // build query for crystalline types
  if (query.crys &&
      query.crys.indexOf('Mono') === -1 &&
      query.crys.indexOf('Poly') !== -1) { // sort by mono

    return _.chain(orgs)
      .sortBy('reviews_length')
      .reverse()
      .sortBy('brands_avg_poly')
      .value();
  } else if (query.crys &&
      query.crys.indexOf('Mono') !== -1 &&
      query.crys.indexOf('Poly') === -1) {
    return _.chain(orgs)
      .sortBy('reviews_length')
      .reverse()
      .sortBy('brands_avg_mono')
      .value();
  }

  return _.chain(orgs)
    .sortBy('reviews_length')
    .reverse()
    .sortBy('brands_avg_min')
    .value();
};
