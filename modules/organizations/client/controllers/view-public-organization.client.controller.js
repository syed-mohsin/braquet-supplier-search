'use strict';

// Organizations controller

angular.module('organizations').controller('PublicViewOrganizationController', ['$rootScope', '$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', 'Authentication', 'Socket', 'Pagination',
  function ($rootScope, $scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, Authentication, Socket, Pagination) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

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

    $scope.findOne = function() {
      if (Authentication.user) {
        $state.go('organizations.view', $stateParams);
      } else {
        // go to not-logged in view
        $http.get('/api/organizations/' + $stateParams.name + '/name-public')
        .then(function(resp) {
          $scope.organization = resp.data;
          $scope.organization.$resolved = true;

          // set page title+description for SEO
          var defaultDescr = 'See Reviews, Quotes, and Products for Suppliers. ';
          $rootScope.pageTitle = $scope.organization.companyName + ' | Braquet';
          $rootScope.description = defaultDescr + $scope.organization.about;

          // initialize tabs
          $scope.initializePageNavBar();
        })
        .catch(function(resp) {
          console.log('error finding org', resp.data);
          $state.go('not-found');
        });
      }
    };
  }]);
