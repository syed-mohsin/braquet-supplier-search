'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;
    
  }
]);
