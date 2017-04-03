'use strict';

angular.module('organizations').controller('ViewOrganizationController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$modal', 'FileUploader', 'Authentication', 'Socket', 'Organizations',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $modal, FileUploader, Authentication, Socket, Organizations) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    $scope.findOne = function () {
      // get organization
      Organizations.get({
        organizationId: $stateParams.organizationId
      }, function(organization) {
        $scope.organization = organization;
        $scope.buildUploader(organization._id);
      }, function(error) {
        $location.path('/forbidden');
      });

      // check if user has already submitted a review for this organization
      $http({
        url: '/api/reviews/is-reviewed',
        params: { organizationId: $stateParams.organizationId }
      })
      .then(function(response) {
        $scope.isReviewSubmitted = response.data.existingReview;
      });
    };

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/organizations/logo/',
      alias: 'newLogo'
    });

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

    // popup dialog that allows user to create a review
    $scope.showReviewView = function(ev, organizationId) {
      var modalInstance = $modal.open({
        templateUrl: '/modules/reviews/client/views/create-review.client.view.html',
        controller: 'CreateReviewsController',
        resolve: {
          modalOrganizationId: function() {
            return organizationId;
          }
        },
        windowClass: 'app-modal-window'
      });

      // successfully created a review
      modalInstance.result.then(function() {
        if (organizationId) {
          $scope.findOne();
          $scope.isReviewSubmitted = true;
        }
      });
    };

    $scope.showAddUsers = function(ev) {
      console.log(ev);

      var modalInstance = $modal.open({
        templateUrl: '/modules/organizations/client/views/add-users.client.view.html',
        windowClass: 'app-modal-window',
        controller: function($scope, $http, $modalInstance, Users) {
          $scope.addedUsers = [];
          $scope.potentialUsers = $scope.organization.possibleUsers;

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

          // build page after defining necessary functions
          $scope.buildPager();

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

  }]);
