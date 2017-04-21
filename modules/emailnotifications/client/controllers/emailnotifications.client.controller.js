'use strict';

// EmailNotifications controller
angular.module('emailNotifications').controller('EmailNotificationsController', ['$scope', '$stateParams', '$location', 'Authentication', 'EmailNotifications',
  function ($scope, $stateParams, $location, Authentication, EmailNotifications) {
    $scope.authentication = Authentication;

    // Create new EmailNotification
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'emailNotificationForm');

        return false;
      }

      // Create new EmailNotification object
      var emailNotification = new EmailNotifications({
        title: this.title,
        content: this.content
      });

      // Redirect after save
      emailNotification.$save(function (response) {
        $location.path('emailNotifications/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.content = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing EmailNotification
    $scope.remove = function (emailNotification) {
      if (emailNotification) {
        emailNotification.$remove();

        for (var i in $scope.emailNotifications) {
          if ($scope.emailNotifications[i] === emailNotification) {
            $scope.emailNotifications.splice(i, 1);
          }
        }
      } else {
        $scope.emailNotification.$remove(function () {
          $location.path('emailNotifications');
        });
      }
    };

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
