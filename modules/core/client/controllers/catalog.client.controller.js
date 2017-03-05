'use strict';

angular.module('core').controller('CatalogController', ['$scope', '$filter', '$http', 'Authentication', 'PanelModels',
  function ($scope, $filter, $http, Authentication, PanelModels) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.search = '';

    // used to toggle filter on xs screen size
    $scope.hiddenFilterClass = 'hidden-xs';

    // initialize panel models
    $http.get('/api/organizations-catalog')
      .success(function(orgs) {
        $scope.orgsAll = orgs;
        $scope.orgs = orgs;
        $scope.buildPager();

        $scope.buildWattCheckboxes();
        $scope.buildOrgCheckboxes();
      });

    $scope.updateFilter = function() {
      var temp = $scope.orgs;
      $scope.orgs = [];

      // find all checked boxes for wattage
      var checked = [];
      for (var key in $scope.wattCheckboxes) {
        if ($scope.wattCheckboxes[key]) {
          checked.push(key);
        }
      }

      // find all checked manufacturers
      $scope.checkedManufacturers = [];
      for (key in $scope.orgCheckboxes) {
        if ($scope.orgCheckboxes[key]) {
          $scope.checkedManufacturers.push(key);
        }
      }

      $scope.calculateItemsToDisplay(checked);
      $scope.figureOutItemsToDisplay();
    };

    $scope.calculateItemsToDisplay = function(checked) {
      $scope.orgs = [];
      if (!checked.length) {
        $scope.orgs = $scope.orgsAll;
      } else {
        // filter wattage range first
        $scope.orgs = $scope.orgsAll.filter(function(org) {
          return org.panel_models.some(function(panel) {
            var finalCheck = false;
            var wattage = panel.stcPowerW;
            var manufacturer = panel.manufacturer;
            checked.forEach(function(check) {
              if (check === '  0 - 100 Watts') finalCheck = finalCheck || wattage <= 100;
              else if (check === '101 - 200 Watts') finalCheck = finalCheck || (wattage > 100 && wattage <= 200);
              else if (check === '201 - 300 Watts') finalCheck = finalCheck || (wattage > 200 && wattage <= 300);
              else if (check === '301 - 400 Watts') finalCheck = finalCheck || (wattage > 300 && wattage <= 400);
              else if (check === '401 - 500 Watts') finalCheck = finalCheck || (wattage > 400 && wattage <= 500);
            });

            return finalCheck;
          });
        });
      }

      if (!$scope.checkedManufacturers.length) {
        return;
      }
      else {
        // filter by manufacturers
        $scope.orgs = $scope.orgs.filter(function(org) {
          return org.panel_models.some(function(panel) {
            var finalCheck = false;
            var manufacturer = panel.manufacturer;
            $scope.checkedManufacturers.forEach(function(check) {
              finalCheck = finalCheck || (manufacturer === check);
            });

            return finalCheck;
          });
        });
      }
    };

    $scope.toggleFilter = function() {
      $scope.hiddenFilterClass = $scope.hiddenFilterClass ? '' : 'hidden-xs';
    };

    $scope.buildWattCheckboxes = function() {
      $scope.ranges = [
        '  0 - 100 Watts',
        '101 - 200 Watts',
        '201 - 300 Watts',
        '301 - 400 Watts',
        '401 - 500 Watts'
      ];

      $scope.wattCheckboxes = {};
      $scope.ranges.forEach(function(range) {
        $scope.wattCheckboxes[range] = false;
      });
    };

    $scope.buildOrgCheckboxes = function() {
      $http.get('/api/panelmodels-manufacturers')
        .success(function(data) {
          $scope.manufacturers = data;
          $scope.orgCheckboxes = {};
          data.forEach(function(manufacturer) {
            $scope.orgCheckboxes[manufacturer] = false;
          });
        });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.orgs, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);
