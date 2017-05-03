'use strict';

angular.module('users').controller('ChangeEmailPreferencesController', ['$scope', '$http', 'Authentication', 'EmailNotifications',
  function ($scope, $http, Authentication, EmailNotifications) {
    $scope.user = Authentication.user;

    // get user's email notification preferences
    $http.get('/api/emailnotifications/get-my-notification')
    .then(function(resp) {
      $scope.emailNotification = resp.data ? resp.data : {};
    })
    .catch(function(err) {
      console.log('Unable to load user email settings', err);
    });

    $scope.updateEmailNotification = function(isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var emailNotification = new EmailNotifications($scope.emailNotification);
      emailNotification.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'userForm');

        $scope.success = true;
        $scope.emailNotification = response;
      }, function (response) {
        $scope.error = response.data.message;
      });
    };
  }
]);
