'use strict';

angular.module('core').controller('HomeController', ['$scope', '$state', 'Authentication',
  function ($scope, $state, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.searchCatalog = function() {
      var query = {};
      query.crys = $scope.panelType;
      query.quantity = $scope.quantity;
      $state.go('catalog', query);
    };

    $scope.goToCatalog = function() {
      $state.go('catalog');
    };
  }
]);
