'use strict';

// Connections controller

angular.module('connections').controller('ConnectionsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Connections',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, Authentication, Socket, GetBids, PanelModels, Projects, Connections) {
    $scope.authentication = Authentication;

    Connections.query(function (data) {
      $scope.connections = data;
      $scope.buildPager();
    });

    $scope.inviteByEmail = function(isValid) {
      $scope.success = $scope.error = null;

      console.log(isValid);

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'InviteByEmailForm');

        return false;
      }

      $http.post('/api/connection-auth/send-invite', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;
        console.log(response);

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });

    };

    // Accept User connection invite
    $scope.acceptRequest = function(user) {
      $http.post('/api/connection-auth/accept-invite', user)
        .success(function(response) {
          var conn_index = $scope.connection_requests.indexOf(user);
          $scope.connection_requests[conn_index].isAccepted = true;
          $scope.connection_requests.splice(conn_index, 1);
          $scope.connections.push(user);
        });
    };

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

    // Find a list of ALL Connections
    $scope.find = function () {
      Connections.query({}, function(connections) {
        $scope.connections = connections;
      });

      $http.get('/api/connection-requests').success(function(requests) {
        $scope.connection_requests = requests;
      });
    };

    $scope.findOne = function () {
      Connections.get({
        connectionId: $stateParams.connectionId
      }, function(connection) {
        $scope.connection = connection;
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
