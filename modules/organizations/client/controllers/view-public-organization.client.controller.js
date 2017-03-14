'use strict';

// Organizations controller

angular.module('organizations').controller('PublicViewOrganizationController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', 'Authentication', 'Socket', 'publicOrgService',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, Authentication, Socket, publicOrgService) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    if (Authentication.user) {
      $state.go('organizations.view', { organizationId: publicOrgService.data._id });
    }

    $scope.organization = publicOrgService.data;
  }]);
