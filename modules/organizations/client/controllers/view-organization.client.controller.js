'use strict';

angular.module('organizations').controller('ViewOrganizationController', ['$rootScope', '$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$modal', 'FileUploader', 'Authentication', 'Socket', 'Organizations', 'Notification', '$analytics', 'Pagination',
  function ($rootScope, $scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $modal, FileUploader, Authentication, Socket, Organizations, Notification, $analytics, Pagination) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;
    $scope.resolvedResources = 0;
    $scope.expectedResources = 3;

    // set filter params if exists
    $scope.manufacturer = $stateParams.manufacturer;
    $scope.panelType = $stateParams.panelType;

    // show following conditional
    $scope.displayUserIsFollowing = function(organization) {
      return (
        organization &&
        $scope.emailNotification &&
        $scope.emailNotification.followingOrganizations &&
        $scope.emailNotification.followingOrganizations.indexOf(organization._id) !== -1
      );
    };

    $scope.showView = function(viewType, itemsArray, page) {
      $scope.viewType = viewType;

      $scope.pageSettings = Pagination.buildPage(itemsArray, page);
    };

    $scope.shouldShowType = function(viewType) {
      return $scope.viewType === viewType;
    };

    $scope.changeTab = function(viewType) {
      $stateParams.view = viewType;
      $stateParams.page = undefined;

      $state.go('organizations.view', $stateParams);
    };

    $scope.initializePageNavBar = function() {
      var page = $stateParams.page;

      var viewTypes = {
        'reviews': $scope.organization.reviews,
        'prices': $scope.organization.priceReviews,
        'products': $scope.organization.panel_models
      };

      // by default or by invalid param, set default to show Prices
      if (!($stateParams.view in viewTypes)) {
        $scope.showView('prices', $scope.organization.priceReviews, page);
        return;
      }

      // find valid view
      Object.keys(viewTypes).forEach(function(viewType) {
        if (viewType === $stateParams.view) {
          $scope.showView(viewType, viewTypes[viewType], page);
        }
      });
    };

    $scope.pageChanged = function() {
      $stateParams.page = $scope.pageSettings.currentPage;
      $stateParams.view = null;

      var viewTypes = ['reviews', 'prices', 'products'];

      // find valid view
      viewTypes.forEach(function(viewType) {
        if (viewType === $scope.viewType) {
          $stateParams.view = $scope.viewType;
        }
      });

      if (!$stateParams.view) $stateParams.view = 'prices';

      $state.go('organizations.view', $stateParams);
    };

    $scope.sortBy = function(sortType) {
      $stateParams.ascending = sortType === $stateParams.sortType ? !$stateParams.ascending : false;
      $stateParams.sortType = sortType;
      $stateParams.page = 1;

      $state.go('organizations.view', $stateParams);
    };

    $scope.showNumberOfResultsOnPage = function() {
      if (!$scope.pageSettings) return;

      var page = $scope.pageSettings.currentPage;
      var itemsPerPage = $scope.pageSettings.itemsPerPage;
      var totalCount = $scope.pageSettings.totalCount;

      var upperLimit = (page * itemsPerPage) < totalCount ? (page * itemsPerPage) : totalCount;
      var lowerLimit = (upperLimit - itemsPerPage + 1) > 0 ? (upperLimit - itemsPerPage + 1) : 1;
      if (totalCount === 0) {
        lowerLimit = 0;
      }

      return lowerLimit + '-' + upperLimit + ' of ' + totalCount + ' results';
    };

    $scope.search = function(searchManufacturerText) {
      return $filter('filter')($scope.organization.manufacturers, {
        $: searchManufacturerText
      });
    };

    $scope.applyFilters = function() {
      $stateParams.page = 1;
      $stateParams.manufacturer = $scope.manufacturer;
      $stateParams.panelType = $scope.panelType;

      $state.go('organizations.view-public', $stateParams);
    };

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
      $http({
        url: '/api/organizations/' + $stateParams.name + '/name',
        params: $stateParams
      })
      .then(function(resp) {
        // store returned organization
        var organization = resp.data;
        $scope.organization = organization;
        $scope.resolvedResources++;
        $scope.buildUploader(organization._id);

        // initialize tabs ang pagination
        $scope.initializePageNavBar();

        // set page title+description for SEO
        var defaultDescr = 'See Reviews, Quotes, and Products for Suppliers. ';
        $rootScope.pageTitle = $scope.organization.companyName + ' | Braquet';
        $rootScope.description = defaultDescr + $scope.organization.about;

        // determine if user has previously reviewed organization
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
