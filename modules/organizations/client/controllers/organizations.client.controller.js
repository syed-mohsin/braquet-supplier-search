'use strict';

// Organizations controller

angular.module('organizations').controller('OrganizationsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$modal', 'FileUploader', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Organizations',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $modal, FileUploader, Authentication, Socket, GetBids, PanelModels, Projects, Organizations) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/organizations/logo/',
      alias: 'newLogo'
    });

    Organizations.query(function (data) {
      $scope.organizations = data;
      $scope.buildPager();
    });

    $scope.loadPanelModelsData = function() {
      $scope.panel_models = [];

      $scope.panelData = PanelModels.query();

      $scope.getMatches = function (text) {
        var filteredItems = $filter('filter')($scope.panelData, {
          $: text
        });

        return filteredItems;
      };
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
        industry: this.industry,
        product_types: this.product_types,
        panel_models: this.panel_models,
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
    };

    $scope.findOne = function () {
      Organizations.get({
        organizationId: $stateParams.organizationId
      }, function(organization) {
        $scope.organization = organization;
        $scope.buildUploader(organization._id);
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

    $scope.buildUploader = function(organizationId) {
      // change uploader url
      $scope.uploader.url = 'api/organizations/logo/' + organizationId;

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
              $scope.organization.logoImageUrl = fileReaderEvent.target.result;
            }, 0);
          };
        }
      };

      $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        // Show success message
        $scope.success = true;

        // Populate organization object
        $scope.organization = response;

        // Clear upload buttons
        $scope.cancelUpload();
      };

      // Called after the user has failed to uploaded a new picture
      $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
        // Clear upload buttons
        $scope.cancelUpload();

        // Show error message
        $scope.error = response.message;
      };

      // Change user profile picture
      $scope.uploadProfilePicture = function () {
        // Clear messages
        $scope.success = $scope.error = null;

        // Start upload
        $scope.uploader.uploadAll();
      };

      // Cancel the upload process
      $scope.cancelUpload = function () {
        $scope.uploader.clearQueue();
        $scope.imageURL = $scope.user.profileImageURL;
      };
    };

    $scope.showAddUsers = function(ev) {
      console.log(ev);
      

      var modalInstance = $modal.open({
        templateUrl: '/modules/organizations/client/views/add-users.client.view.html',
        windowClass: 'app-modal-window',
        controller: function($scope, $http, $modalInstance, Users) {
          $scope.addedUsers = [];
          $http.get('/api/organizations/' + $scope.organization._id + '/getPotentialUsers')
            .success(function (response) {
              $scope.potentialUsers = response;
              $scope.figureOutItemsToDisplay();

              // for pagination
              $scope.buildPager();
            }).error(function (response) {
              // Show user error message and clear form
              $modalInstance.close();
          });


          $scope.buildPager = function () {
            $scope.pagedItems = [];
            $scope.itemsPerPage = 5;
            $scope.currentPage = 1;
            $scope.figureOutItemsToDisplay();
          };

          $scope.figureOutItemsToDisplay = function () {
            $scope.filteredItems = $filter('filter')($scope.potentialUsers, {
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

          $scope.toggle = function(user) {
            var potentialUsersIndexOf = $scope.potentialUsers.indexOf(user);
            var addedUsersIndexOf = $scope.addedUsers.indexOf(user);

            // move user to addedUsers array
            if (potentialUsersIndexOf !== -1 && addedUsersIndexOf === -1) {
              $scope.addedUsers.push($scope.potentialUsers.splice(potentialUsersIndexOf, 1)[0]);
            // remove user from addedUsers and move back to users
            } else if (potentialUsersIndexOf === -1 && addedUsersIndexOf !== -1) {
              $scope.potentialUsers.push($scope.addedUsers.splice(addedUsersIndexOf, 1)[0]);
            }

            $scope.figureOutItemsToDisplay();
          };

          $scope.acceptUsers = function() {
            $http.post('/api/organizations/' + $scope.organization._id + '/addUsers', $scope.addedUsers)
              .success(function (response) {
              
              $scope.organization = response;                
              $modalInstance.close();

            }).error(function (response) {
              // Show user error message and clear form
              $scope.error = response.message;
            });
          };
        },
        scope: $scope
      });

      modalInstance.result.then(function() {
        $scope.findOne();
      });
    };
  }
]);