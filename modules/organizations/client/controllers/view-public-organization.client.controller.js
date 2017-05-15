'use strict';

// Organizations controller

angular.module('organizations').controller('PublicViewOrganizationController', ['$rootScope', '$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', 'Authentication', 'Socket',
  function ($rootScope, $scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, Authentication, Socket) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    $scope.initializePageNavBar = function() {
      // tab viewing booleans
      $scope.shouldShowReviews = false;
      $scope.shouldShowPrices = true;
      $scope.shouldShowProducts = false;
    };

    $scope.showReviews = function() {
      $scope. shouldShowReviews = true;
      $scope.shouldShowPrices = false;
      $scope.shouldShowProducts = false;
    };

    $scope.showPrices = function() {
      $scope. shouldShowReviews = false;
      $scope.shouldShowPrices = true;
      $scope.shouldShowProducts = false;
    };

    $scope.showProducts = function() {
      $scope. shouldShowReviews = false;
      $scope.shouldShowPrices = false;
      $scope.shouldShowProducts = true;
    };

    // initialize tabs
    $scope.initializePageNavBar();

    $scope.findOne = function() {
      if (Authentication.user) {
        $state.go('organizations.view', { name: $stateParams.name });
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
        })
        .catch(function(resp) {
          console.log('error finding org', resp.data);
          $state.go('not-found');
        });
      }
    };
  }]);
