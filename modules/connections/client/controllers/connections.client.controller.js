'use strict';

// Connections controller

angular.module('projects').controller('ConnectionsController', ['$scope', '$state', '$stateParams', '$location', '$timeout', '$interval', '$filter', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Connections',
  function ($scope, $state, $stateParams, $location, $timeout, $interval, $filter, Authentication, Socket, GetBids, PanelModels, Projects, Connections) {
    $scope.authentication = Authentication;
  	
  	Connections.query(function (data) {
      $scope.connections = data;
      $scope.buildPager();
    });

    // Add new connection
    $scope.create = function (userId) {
      $scope.error = null;

      // Create new Connection object
      var connection = new Connections({
      	user: userId
      });

      // Redirect after save
      connection.$save(function (response) {
        $state.go('connections');

      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'connectionForm');

        return false;
      }

      var connection = $scope.connection;

      connection.$update(function () {
        $state.go('connections.view', {
          connectionId: connection._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function (connection) {
      if (confirm('Are you sure you want to delete this connection?')) {
        if (connection) {
          connection.$remove();

          $scope.connections.splice($scope.connections.indexOf(connection), 1);
        } else {
          $scope.connection.$remove(function () {
            $state.go('connections');
          });
        }
      }
    };

    $scope.findOne = function () {
      $scope.connection = Connections.get({
        connectionId: $stateParams.connectionId
      }, function(connection) {

      }, function(error) {
        $location.path('/forbidden');
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.connections, {
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