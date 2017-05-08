'use strict';

angular.module('core').controller('ContactController', ['$scope', '$state', '$http', 'Authentication', 'Notification',
  function ($scope, $state, $http, Authentication, Notification) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.contact = function(isValid) {
      $scope.error = null;

      if(!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'contactForm');

        return false;
      }

      var contactForm = {
        content: this.content,
        email: this.email,
        fullName: this.fullName
      };

      $http.post('/api/contact/', contactForm)
        .then(function(response) {
          $state.go('home');
          Notification.primary('Message sent successfully');
        })
        .catch(function(errorResponse) {
          if(errorResponse && errorResponse.data.message) {
            $scope.error = errorResponse.data.message;
          } else {
            $scope.error = 'Something went wrong...';
          }
        });
    };
  }
]);
