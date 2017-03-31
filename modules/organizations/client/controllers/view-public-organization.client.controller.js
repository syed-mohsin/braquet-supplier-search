'use strict';

// Organizations controller

angular.module('organizations').controller('PublicViewOrganizationController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', 'Authentication', 'Socket', 'growl',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, Authentication, Socket, growl) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    $scope.findOne = function() {
      if (Authentication.user) {
        $state.go('organizations.view', { organizationId: $stateParams.organizationId });
      } else {
        // go to not-logged in view
        $http.get('/api/organizations/' + $stateParams.organizationId + '/public')
        .then(function(resp) {
          $scope.organization = resp.data;
          $scope.organization.$resolved = true;
          console.log('growl:', growl);
          growl.error('This is a warning', { title: 'Error!' });
        });
      }
    };
  }]);
