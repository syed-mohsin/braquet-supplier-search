'use strict';

angular.module('core').controller('HomeController', ['$scope', '$state', 'Authentication',
  function ($scope, $state, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.canadianSolarRating = 4;

    $scope.searchCatalog = function() {
      var query = {};
      query.crys = $scope.panelType;
      query.quantity = $scope.quantity;
      query.isman = true;

      if (query.crys === 'all') {
        query.crys = 'Mono|Poly';
      }

      $state.go('catalog', query);
    };

    $scope.goToCatalog = function() {
      $state.go('catalog');
    };
  }
]);
