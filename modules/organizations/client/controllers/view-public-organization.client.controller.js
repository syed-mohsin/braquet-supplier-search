'use strict';

// Organizations controller

angular.module('organizations').controller('PublicViewOrganizationController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', 'Authentication', 'Socket',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, Authentication, Socket) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    $scope.findOne = function() {
      $http.get('/api/organizations/' + $stateParams.organizationId + '/public')
      .then(function(resp) {
        $scope.organization = resp.data;
        $scope.organization.$resolved = true;
      });
    };
  }]);
