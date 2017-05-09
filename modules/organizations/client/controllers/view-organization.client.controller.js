'use strict';

angular.module('organizations').controller('ViewOrganizationController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$modal', 'FileUploader', 'Authentication', 'Socket', 'Organizations', 'Notification', '$analytics',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $modal, FileUploader, Authentication, Socket, Organizations, Notification, $analytics) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;
    $scope.resolvedResources = 0;
    $scope.expectedResources = 3;

    // show following conditional
    $scope.displayUserIsFollowing = function(organization) {
      return (
        organization &&
        $scope.emailNotification &&
        $scope.emailNotification.followingOrganizations &&
        $scope.emailNotification.followingOrganizations.indexOf(organization._id) !== -1
      );
    };

    $scope.initializePageNavBar = function() {
      // tab viewing booleans
      $scope.shouldShowReviews = false;
      $scope.shouldShowPrices = true;
      $scope.shouldShowProducts = false;
    };

    $scope.showReviews = function() {
      $scope.shouldShowReviews = true;
      $scope.shouldShowPrices = false;
      $scope.shouldShowProducts = false;
    };

    $scope.showPrices = function() {
      $scope.shouldShowReviews = false;
      $scope.shouldShowPrices = true;
      $scope.shouldShowProducts = false;
    };

    $scope.showProducts = function() {
      $scope.shouldShowReviews = false;
      $scope.shouldShowPrices = false;
      $scope.shouldShowProducts = true;
    };

    // initialize tabs
    $scope.initializePageNavBar();

    $scope.getUserEmailNotification = function() {
      if (!Authentication.user) {
        $scope.emailNotification = {};
        $scope.resolvedResources++;
        return;
      }

      $http.get('/api/emailnotifications/get-my-notification')
      .then(function(resp) {
        $scope.emailNotification = resp.data ? resp.data : {};

        $scope.resolvedResources++;
      })
      .catch(function(err) {
        console.log('Unable to load user email settings', err);
      });
    };

    $scope.followOrganization = function(ev, organization) {
      if (!Authentication.user) {
        return $state.go('authentication.signin');
      }

      $http.get('/api/emailnotifications-follow/' + organization._id)
      .then(function(response) {
        $scope.emailNotification = response.data.newEmailNotification;
        var isFollowing = response.data.isFollowing;

        var notificationString = isFollowing ? 'Following' : 'Unfollowed';
        Notification.primary(notificationString + ' ' + organization.companyName);
        $analytics.eventTrack('User ' + Authentication.user.displayName + ' ' + (isFollowing ? 'Following' : 'Unfollowed') + ' ' + organization.companyName);
      })
      .catch(function(err) {
        console.log('unable to follow organization', err);
        Notification.error('Error updating supplier following settings');
      });
    };

    $scope.findOne = function() {
      $scope.resolvedResources = 0;

      // fetch organization by name
      $http.get('/api/organizations/' + $stateParams.name + '/name')
      .then(function(resp) {
        // store returned organization
        var organization = resp.data;
        $scope.organization = organization;
        $scope.resolvedResources++;
        $scope.buildUploader(organization._id);

        return $http({
          url: '/api/reviews/is-reviewed',
          params: { organizationId: organization._id }
        });
      })
      .then(function(resp) {
        $scope.isReviewSubmitted = resp.data.existingReview;
        $scope.resolvedResources++;
      })
      .catch(function(err) {
        console.log('unable to fetch org or review submitted check:', err.data);
        $state.go('not-found');
      });

      // fetch users email notification settings
      $scope.getUserEmailNotification();
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

    $scope.contactSupplier = function(ev, organization) {
      var modalInstance = $modal.open({
        templateUrl: '/modules/organizations/client/views/contact-supplier.client.view.html',
        controller: 'ContactSupplierController',
        resolve: {
          modalOrganization: function() {
            return organization;
          }
        },
        windowClass: 'app-modal-window'
      });

      modalInstance.result.then(function() {
        if (organization) {
          Notification.primary('A contact request has been sent to ' + organization.companyName + '.');
        }
      });
    };

    // popup dialog that allows user to create a review
    $scope.showReviewView = function(ev, organization) {
      var modalInstance = $modal.open({
        templateUrl: '/modules/reviews/client/views/create-review.client.view.html',
        controller: 'CreateReviewsController',
        resolve: {
          modalOrganization: function() {
            return organization;
          }
        },
        windowClass: 'app-modal-window'
      });

      // successfully created a review
      modalInstance.result.then(function() {
        if (organization) {
          $scope.findOne();
          $scope.isReviewSubmitted = true;

          // Notify user that their review was successully created
          Notification.primary('Submitted Review Successfully. Your review may need to be verified.');
          if ($scope.user && !$scope.user.emailVerified) {
            Notification.warning('Please confirm your email to speed up the verification process');
          }
        }
      });
    };

    // popup dialog that allows user to create a review
    $scope.showPriceReviewView = function(ev, organization) {
      var modalInstance = $modal.open({
        templateUrl: '/modules/pricereviews/client/views/create-pricereview.client.view.html',
        controller: 'CreatePriceReviewsController',
        resolve: {
          modalOrganization: function() {
            return organization;
          }
        },
        windowClass: 'app-modal-window'
      });

      // successfully created a review
      modalInstance.result.then(function() {
        if (organization) {
          $scope.findOne();
          $scope.showPrices();
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
