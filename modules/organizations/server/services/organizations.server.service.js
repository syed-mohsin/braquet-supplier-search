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

    // iterate through all locations in locations array on panel
    organization.panel_manufacturing_locations = panel.manufacturingLocations.reduce(function(arr, loc) {
      if (arr.indexOf(loc) === -1) {
        arr.push(loc);
      }

      return arr;
    }, []);
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

  // build query for manufacturing locations
  if (query.locs) {
    var locsCondition = query.locs.split('|').filter(function(l) { return l.length !== 0; });
    organizationQueryParams.panel_manufacturing_locations = { '$in': locsCondition };
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

exports.calculateBrandsAveragePrice = function(org) {
  var price_sum_mono = 0;
  var price_sum_poly = 0;
  var brands_length_mono = 0;
  var brands_length_poly = 0;

  for (var key in org.brands) {
    if (key.split('#')[1] === 'Mono') {
      price_sum_mono += org.brands[key];
      ++brands_length_mono;
    } else if (key.split('#')[1] === 'Poly') {
      price_sum_poly += org.brands[key];
      ++brands_length_poly;
    }
  }

  // calcuate average for each panel type across brands
  org.brands_avg_mono = (price_sum_mono / brands_length_mono) || Infinity;
  org.brands_avg_poly = (price_sum_poly / brands_length_poly) || Infinity;
  org.brands_avg_min = Math.min(org.brands_avg_poly, org.brands_avg_mono);

  return org;
};

exports.extractBrands = function(organizations) {
  return organizations.map(function(org) {
    // group all price reviews by brand
    org.brands = _.groupBy(org.priceReviews, function(priceReview) {
      return priceReview.manufacturer + '#' + priceReview.panelType;
    });

    org.testbrands = _.chain(org.priceReviews)
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

    // calcuate median of all price reviews under a brand
    org.brands = _.mapObject(org.brands, function(brand) {
      brand.sort(function (a, b) { return a.price - b.price; });
      var lowMiddle = Math.floor((brand.length - 1) / 2);
      var highMiddle = Math.ceil((brand.length - 1) / 2);
      var median = (brand[lowMiddle].price + brand[highMiddle].price) / 2;
      return median;
    });

    // calculate average for each type of panel
    org = exports.calculateBrandsAveragePrice(org);

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
