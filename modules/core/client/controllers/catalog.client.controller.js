'use strict';

angular.module('core').controller('CatalogController', ['$scope', '$filter', '$http', 'Authentication', 'PanelModels',
  function ($scope, $filter, $http, Authentication, PanelModels) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.search = '';

    // initialize panel models
    $http.get('/api/organizations-catalog')
      .success(function(orgs) {
        $scope.orgs = orgs;
        $scope.buildPager();

        $scope.checkboxes = {
          under_100: false,
          under_200: false,
          under_300: false,
          under_400: false,
          under_500: false
        };
      });

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
