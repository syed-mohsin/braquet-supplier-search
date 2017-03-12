'use strict';

angular.module('core').controller('CatalogController', ['$scope', '$filter', '$http', '$state', '$stateParams', 'Authentication', 'PanelModels',
  function ($scope, $filter, $http, $state, $stateParams, Authentication, PanelModels) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.search = $stateParams.q;

    $scope.query = {};
    $scope.query.q = $stateParams.q;
    $scope.query.man = $stateParams.man;
    $scope.query.pow = $stateParams.pow;
    $scope.query.page = $stateParams.page;

    // used to toggle filter on xs screen size
    $scope.hiddenFilterClass = 'hidden-xs';

    // initialize panel models
    $http({
      url: '/api/organizations-catalog',
      params: {
        q: $stateParams.q,
        man: $stateParams.man,
        pow: $stateParams.pow,
        page: $stateParams.page
      }
    })
    .success(function(resp) {
      $scope.orgs = resp.orgs;
      $scope.buildPager(resp.count);

      $scope.buildWattCheckboxes();
      $scope.buildOrgCheckboxes();
    });

    $scope.updateFilter = function() {
      var man = '';
      var pow = '';

      // find all checked boxes for wattage
      for (var key in $scope.wattCheckboxes) {
        if ($scope.wattCheckboxes[key]) {
          pow += key + '|';
        }
      }

      // find all checked manufacturers
      for (key in $scope.orgCheckboxes) {
        if ($scope.orgCheckboxes[key]) {
          man += key + '|';
        }
      }

      $scope.query.man = man;
      $scope.query.pow = pow;
      $state.go('catalog', $scope.query);
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
          var queryCheckedBoxes = $state.params.man.split('|');
          data.forEach(function(manufacturer) {
            $scope.orgCheckboxes[manufacturer] = queryCheckedBoxes.indexOf(manufacturer) !== -1 ? true : false;
          });
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

    $scope.searchSubmit = function() {
      $scope.query.q = $scope.search;
      $state.go('catalog', $scope.query);
    };
  }
]);
