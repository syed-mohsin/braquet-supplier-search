'use strict';

angular.module('core').controller('CatalogController', ['$scope', '$filter', '$http', '$state', '$stateParams', 'Authentication', 'PanelModels',
  function ($scope, $filter, $http, $state, $stateParams, Authentication, PanelModels) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.resolvedResources = 0;
    $scope.search = $stateParams.q;

    $scope.query = {};
    $scope.query.q = $stateParams.q;
    $scope.query.man = $stateParams.man;
    $scope.query.pow = $stateParams.pow;
    $scope.query.crys = $stateParams.crys;
    $scope.query.color = $stateParams.color;
    $scope.query.cells = $stateParams.cells;
    $scope.query.page = $stateParams.page;
    $stateParams.quantity = $stateParams.quantity ? $stateParams.quantity : '0kW-100kW';
    $scope.query.quantity = $stateParams.quantity;
    $scope.quantity = $scope.query.quantity;
    $scope.query.price = $stateParams.price;

    // used to toggle filter on xs screen size
    $scope.hiddenFilterClass = 'hidden-xs';

    $scope.updateFilter = function() {
      var man = '';
      var pow = '';
      var crys = '';
      var color = '';
      var cells = '';

      // // find all checked boxes for wattage
      // for (var key in $scope.wattCheckboxes) {
      //   if ($scope.wattCheckboxes[key]) {
      //     pow += $scope.rangesReverse[key] + '|';
      //   }
      // }

      // find all checked manufacturers
      for (var key in $scope.orgCheckboxes) {
        if ($scope.orgCheckboxes[key]) {
          man += key + '|';
        }
      }

      // find all checked crystalline types
      for (key in $scope.crysCheckboxes) {
        if ($scope.crysCheckboxes[key]) {
          crys += key + '|';
        }
      }

      // find all checked frame colors
      for (key in $scope.fColorCheckboxes) {
        if ($scope.fColorCheckboxes[key]) {
          color += key + '|';
        }
      }

      // find all checked number of cells
      for (key in $scope.numCellsCheckboxes) {
        if ($scope.numCellsCheckboxes[key]) {
          cells += key + '|';
        }
      }

      $scope.query.man = man;
      $scope.query.pow = pow;
      $scope.query.crys = crys;
      $scope.query.color = color;
      $scope.query.cells = cells;
      $scope.query.quantity = $scope.quantity;
      $scope.query.page = 1;
      $state.go('catalog', $scope.query);
    };


    $scope.toggleFilter = function() {
      $scope.hiddenFilterClass = $scope.hiddenFilterClass ? '' : 'hidden-xs';
    };

    $scope.buildWattCheckboxes = function() {
      $scope.ranges = {
        '100': '0 - 100 Watts',
        '200': '101 - 200 Watts',
        '300': '201 - 300 Watts',
        '400': '301 - 400 Watts',
        '500': '401 - 500 Watts'
      };

      $scope.rangesReverse = {
        '0 - 100 Watts': '100',
        '101 - 200 Watts': '200',
        '201 - 300 Watts': '300',
        '301 - 400 Watts': '400',
        '401 - 500 Watts': '500'
      };

      $scope.wattCheckboxes = {};
      var queryCheckedBoxes = $stateParams.pow ? $stateParams.pow.split('|') : [];
      for (var range in $scope.ranges) {
        $scope.wattCheckboxes[$scope.ranges[range]] = queryCheckedBoxes.indexOf(range) !== -1 ? true : false;
      }
    };

    $scope.buildFilterCheckboxes = function() {
      // get panel model filters
      $http.get('/api/panelmodels-filters')
        .then(function(resp) {
          var filters = resp.data;
          $scope.manufacturers = filters.manufacturers;
          $scope.crystallineTypes = filters.crystallineTypes;
          $scope.frameColors = filters.frameColors;
          $scope.numberOfCells = filters.numberOfCells;

          $scope.orgCheckboxes = {};
          var queryCheckedBoxes = $stateParams.man ? $stateParams.man.split('|') : [];
          $scope.manufacturers.sort(function(a,b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
          });
          $scope.manufacturers.forEach(function(manufacturer) {
            $scope.orgCheckboxes[manufacturer] = queryCheckedBoxes.indexOf(manufacturer) !== -1 ? true : false;
          });

          $scope.crysCheckboxes = {};
          queryCheckedBoxes = $stateParams.crys ? $stateParams.crys.split('|') : [];
          $scope.crystallineTypes.forEach(function(crystallineType) {
            $scope.crysCheckboxes[crystallineType] = queryCheckedBoxes.indexOf(crystallineType) !== -1 ? true : false;
          });

          $scope.fColorCheckboxes = {};
          queryCheckedBoxes = $stateParams.color ? $stateParams.color.split('|') : [];
          $scope.frameColors.forEach(function(frameColor) {
            $scope.fColorCheckboxes[frameColor] = queryCheckedBoxes.indexOf(frameColor) !== -1 ? true : false;
          });

          $scope.numCellsCheckboxes = {};
          queryCheckedBoxes = $stateParams.cells ? $stateParams.cells.split('|').filter(function(c) { return c.length && !isNaN(c); }) : [];
          $scope.numberOfCells.sort(function(a,b) { return a-b; });
          $scope.numberOfCells.splice($scope.numberOfCells.indexOf(null), 1); // remove one null item

          // only accept 3 number of cells
          var accepted = [60, 72, 96];
          $scope.numberOfCells = $scope.numberOfCells.filter(function(numCells) { return accepted.indexOf(numCells) !== -1; });

          $scope.numberOfCells.forEach(function(numCells) {
            if (!numCells) return;
            $scope.numCellsCheckboxes[numCells] = queryCheckedBoxes.indexOf(numCells.toString()) !== -1 ? true : false;
          });

          // increment resolved resources
          $scope.resolvedResources++;
        });

      // get pricereview filters
      $http.get('/api/pricereviews-filters')
        .then(function(resp) {
          var filters = resp.data;
          $scope.quantities = filters.quantities.sort(function(a,b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
          });

          $scope.resolvedResources++;
        });
    };

    $scope.buildPager = function (count) {
      $scope.itemsPerPage = 15;
      $scope.totalCount = count;
      $scope.currentPage = $stateParams.page;
    };

    $scope.pageChanged = function () {
      $scope.query.page = $scope.currentPage;
      $state.go('catalog', $scope.query);
    };

    $scope.sortBy = function() {
      $scope.query.price = $stateParams.price ? '' : true;
      $state.go('catalog', $scope.query);
    };

    $scope.searchSubmit = function() {
      $scope.query.q = $scope.search;
      $scope.query.page = 1;
      $state.go('catalog', $scope.query);
    };

    $scope.routeToOrg = function (organizationId) {
      if (Authentication.user) {
        $state.go('organizations.view', { organizationId: organizationId });
      } else {
        $state.go('organizations.view-public', { organizationId: organizationId });
      }
    };

    // load resources from server after inititalizing all controller functions

    // fetch results based on query
    $http({
      url: '/api/organizations-catalog',
      params: $scope.query
    })
    .then(function(resp) {
      $scope.orgs = resp.data.orgs;
      $scope.buildPager(resp.data.count);

      // increment resolvedResources
      $scope.resolvedResources++;
    })
    .catch(function(err) {
      console.log('err', err);
    });

    // initialize filter boxes
    $scope.buildWattCheckboxes();
    $scope.buildFilterCheckboxes();
  }
]);
