'use strict';

// Organizations controller

angular.module('organizations').controller('OrganizationsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Organizations',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, Authentication, Socket, GetBids, PanelModels, Projects, Organizations) {
    $scope.authentication = Authentication;
  	
  	Organizations.query(function (data) {
      $scope.organizations = data;
      $scope.buildPager();
    });

    $scope.inviteByEmail = function(isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'InviteByEmailForm');

        return false;
      }

      $http.post('/api/organization-auth/send-invite', $scope.credentials).success(function (response) {
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

    // Accept User organization invite
    $scope.acceptRequest = function(user) {
      $http.post('/api/organization-auth/accept-invite', user)
        .success(function(response) {
          var conn_index = $scope.organization_requests.indexOf(user);
          $scope.organization_requests[conn_index].isAccepted = true;
          $scope.organization_requests.splice(conn_index, 1);
          $scope.organizations.push(user);
      });
    };

    // Add new organization
    $scope.create = function (userId) {
      $scope.error = null;

      // Create new Organization object
      var organization = new Organizations({
      	name: this.name

      });

      // Redirect after save
      organization.$save(function (response) {
        $state.go('organizations');

      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'organizationForm');

        return false;
      }

      var organization = $scope.organization;

      organization.$update(function () {
        $state.go('organizations.view', {
          organizationId: organization._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function (organization) {
      if (confirm('Are you sure you want to delete this organization?')) {
        if (organization) {
          organization.$remove();

          $scope.organizations.splice($scope.organizations.indexOf(organization), 1);
        } else {
          $scope.organization.$remove(function () {
            $state.go('organizations');
          });
        }
      }
    };

    // Find a list of ALL Organizations
    $scope.find = function () {
      Organizations.query({}, function(organizations) {
  		$scope.organizations = organizations;
      });

      $http.get('/api/organization-requests').success(function(requests) {
        $scope.organization_requests = requests;
      });
    };

    $scope.findOne = function () {
      Organizations.get({
        organizationId: $stateParams.organizationId
      }, function(organization) {
        $scope.organization = organization;
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