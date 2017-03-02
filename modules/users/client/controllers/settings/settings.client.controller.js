'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // get user organization
    $http.get('api/organizations/' + $scope.user.organization)
      .success(function(org) {
        $scope.user.organization = org;
      });
  }
]);
