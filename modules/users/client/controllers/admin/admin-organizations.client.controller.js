'use strict';

angular.module('users.admin').controller('AdminOrganizationsController', ['$scope', '$http', '$filter', 'Admin',
  function ($scope, $http, $filter, Admin) {

    $scope.find = function() {
      $http.get('/api/organizations-unverified')
      .success(function(organizations) {
        $scope.organizations = organizations;
        $scope.buildPager();
      });
    };

    $scope.verifyOrg = function(organizationId) {
      $http.post('/api/organizations/' + organizationId + '/verify')
      .success(function(organization) {
        $scope.organization = organization;
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {

      $scope.filteredItems = $filter('filter')($scope.organizations, {
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
