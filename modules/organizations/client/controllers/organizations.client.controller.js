'use strict';

// Organizations controller

angular.module('organizations').controller('OrganizationsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', 'FileUploader', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Organizations',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, FileUploader, Authentication, Socket, GetBids, PanelModels, Projects, Organizations) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;
    $scope.imageURL = $scope.user.profileImageURL;

    Organizations.query(function (data) {
      $scope.organizations = data;
      $scope.buildPager();
    });


    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/users/picture',
      alias: 'newProfilePicture'
    });

        // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Add new organization
    $scope.create = function (isValid) {
      $scope.error = null;

      // Check for form submission errors
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'organizationForm');

        return false;
      }

      // Create new Organization object
      var organization = new Organizations({
      	name: this.name,
        logo: this.logo,
        cover_img: this.cover_img,
        industry: this.industry,
        product_types: this.product_types,
        website: this.website,
        headquarters: this.headquarters,
        about: this.about
      });

      // Redirect after save
      organization.$save(function (response) {
        $state.go('organizations.view', {
          organizationId: response._id
        });

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