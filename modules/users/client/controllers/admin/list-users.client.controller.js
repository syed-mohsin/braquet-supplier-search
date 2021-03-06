'use strict';

angular.module('users.admin').controller('UserListController', ['$scope', '$http', '$filter', 'Admin',
  function ($scope, $http, $filter, Admin) {
    Admin.query(function (data) {
      $scope.users = data;
      $scope.buildPager();
    });

    // get all users
    $scope.getAllUsers = function() {
      Admin.query(function (data) {
        $scope.users = data;
        $scope.buildPager();
      });
    };

    $scope.getFilteredUsers = function(query) {
      $http.get('/api/users?filter=' + query)
        .success(function(users) {
          $scope.users = users;
          $scope.buildPager();
        })
        .error(function(err) {
          console.log('could not fetch verified users');
        });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.users, {
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
