'use strict';

// Organizations controller

angular.module('organizations').controller('PublicViewOrganizationController', ['$rootScope', '$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$mdDialog', 'Authentication', 'Socket',
  function ($rootScope, $scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $mdDialog, Authentication, Socket) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    $scope.maxViewsExceeded = function() {
      var count = $window.localStorage ? parseInt($window.localStorage.getItem('c')) : 1;
      return count < 1 || count > 3;
    };

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
    $scope.showSignUpAlert = function(ev) {
      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'modules/organizations/client/views/signup-dialog.client.template.html',
        targetEvent: ev,
        clickOutsideToClose:true
      });
    };

    // initialize tabs
    $scope.initializePageNavBar();

    $scope.findOne = function() {
      if (Authentication.user) {
        $state.go('organizations.view', { name: $stateParams.name });
      } else {
        // track supplier views
        if ($window.localStorage &&
          (!$window.localStorage.getItem('c') ||
          isNaN(parseInt($window.localStorage.getItem('c'))))) {
          // initialize counter
          $window.localStorage.setItem('c', 1);
        } else if ($window.localStorage && window.localStorage.getItem('c')) {
          var count = $window.localStorage.getItem('c');
          $window.localStorage.setItem('c', parseInt(count)+1);
        }

        console.log($window.localStorage.getItem('c'));

        $http({
          url: '/api/organizations/' + $stateParams.name + '/name-public',
          params: { c: $window.localStorage ? $window.localStorage.getItem('c') : 1 }
        })
        .then(function(resp) {
          $scope.organization = resp.data;
          $scope.organization.$resolved = true;

          // set page title+description for SEO
          var defaultDescr = 'See Reviews, Quotes, and Products for Suppliers. ';
          $rootScope.pageTitle = $scope.organization.companyName + ' | Braquet';
          $rootScope.description = defaultDescr + $scope.organization.about;

          // show modal
          if ($scope.maxViewsExceeded()) {
            $scope.showSignUpAlert();
          }
        })
        .catch(function(resp) {
          console.log('error finding org', resp.data);
          $state.go('not-found');
        });
      }
    };
  }]);
