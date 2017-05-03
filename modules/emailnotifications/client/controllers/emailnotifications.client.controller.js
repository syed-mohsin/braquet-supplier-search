'use strict';

// EmailNotifications controller
angular.module('emailNotifications').controller('EmailNotificationsController', ['$scope', '$stateParams', '$location', 'Authentication', 'EmailNotifications',
  function ($scope, $stateParams, $location, Authentication, EmailNotifications) {
    $scope.authentication = Authentication;

    // Update existing EmailNotification
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'emailNotificationForm');

        return false;
      }

      var emailNotification = $scope.emailNotification;

      emailNotification.$update(function () {
        $location.path('emailNotifications/' + emailNotification._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of EmailNotifications
    $scope.find = function () {
      $scope.emailNotifications = EmailNotifications.query();
    };

    // Find existing EmailNotification
    $scope.findOne = function () {
      $scope.emailNotification = EmailNotifications.get({
        emailNotificationId: $stateParams.emailNotificationId
      });
    };
  }
]);
