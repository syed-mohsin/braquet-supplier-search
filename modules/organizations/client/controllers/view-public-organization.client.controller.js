'use strict';

// Organizations controller
angular.module('organizations').controller('PublicViewOrganizationController', ['$rootScope', '$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$mdDialog', 'Authentication', 'Socket', 'Pagination',
  function ($rootScope, $scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $mdDialog, Authentication, Socket, Pagination) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    // set filter params if exists
    $scope.manufacturer = $stateParams.manufacturer;
    $scope.panelType = $stateParams.panelType;
    $scope.quantity = $stateParams.quantity;
    $scope.sortType = $stateParams.sortType;

    $scope.isPreviousLocation = function() {
      return $window && $window.localStorage.getItem('filterSettings');
    };

    $scope.goBack = function() {
      if ($window.localStorage)
        $state.go('catalog', JSON.parse($window.localStorage.getItem('filterSettings')));
      else
        $state.go('catalog');
    };

    $scope.maxViewsExceeded = function() {
      var count = $window.localStorage ? JSON.parse($window.localStorage.getItem('c')).length : 1;
      return count < 0 || count > 3;
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

      $state.go('organizations.view-public', $stateParams);
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

      $state.go('organizations.view-public', $stateParams);
    };

    $scope.sortBy = function(sortType) {
      $stateParams.sortType = sortType;
      $stateParams.page = 1;

      $state.go('organizations.view-public', $stateParams);
    };

    $scope.showNumberOfResultsOnPage = function() {
      if (!$scope.pageSettings) return;

      var page = $scope.pageSettings.currentPage;
      var itemsOnCurrentPage = $scope.pageSettings.items.length;
      var itemsPerPage = $scope.pageSettings.itemsPerPage;
      var totalCount = $scope.pageSettings.totalCount;

      var lowerLimit = ((page-1) * (itemsPerPage) + 1);
      var upperLimit = lowerLimit - 1 + itemsOnCurrentPage;

      // edge case with no results
      if (totalCount === 0) {
        lowerLimit = 0;
        upperLimit = 0;
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
      $stateParams.quantity = $scope.quantity;

      $state.go('organizations.view-public', $stateParams);
    };

    function DialogController($scope, $state, $mdDialog) {
      $scope.login = function() {
        $mdDialog.hide();
        $state.go('authentication.signin');
      };

      $scope.signup = function() {
        $mdDialog.hide();
        $state.go('authentication.signup');
      };
    }

    // alert to sign up
    $scope.showSignUpAlert = function(ev, isMaxAlert) {
      var fileName = isMaxAlert ?
        'signup-dialog.client.template.html' :
        'join-braquet-dialog.client.template.html';

      var config = {
        controller: DialogController,
        templateUrl: 'modules/organizations/client/views/' + fileName,
        targetEvent: ev,
        clickOutsideToClose:true
      };

      $mdDialog.show(config);
    };

    $scope.findOne = function() {
      if (Authentication.user) {
        $state.go('organizations.view', $stateParams);
      } else {

        // track supplier views
        if ($window.localStorage &&
          (!$window.localStorage.getItem('c'))) {
          // initialize counter
          $window.localStorage.setItem('c', JSON.stringify([$stateParams.name]));
        } else if ($window.localStorage && window.localStorage.getItem('c')) {
          var names = JSON.parse($window.localStorage.getItem('c'));
          var name = $stateParams.name;

          if (names.indexOf(name) === -1) {
            var newNames = JSON.stringify(names.concat([name]));
            $window.localStorage.setItem('c', newNames);
          }
        }

        // merge url queries with view tracker
        $stateParams.c = $window.localStorage ? JSON.parse($window.localStorage.getItem('c')).length : 1;

        $http({
          url: '/api/organizations/' + $stateParams.name + '/name-public',
          params: $stateParams
        })
        .then(function(resp) {
          $scope.organization = resp.data;
          $scope.organization.$resolved = true;

          // set page title+description for SEO
          var defaultDescr = 'See Reviews, Quotes, and Products for Suppliers. ';
          $rootScope.pageTitle = $scope.organization.companyName + ' | Braquet';
          $rootScope.description = defaultDescr + $scope.organization.about;

          // initialize tabs
          $scope.initializePageNavBar();

          // show modal
          if ($scope.maxViewsExceeded()) {
            $scope.showSignUpAlert(null, true);
          }
        })
        .catch(function(resp) {
          console.log('error finding org', resp.data);
          $state.go('not-found');
        });
      }
    };
  }]);
