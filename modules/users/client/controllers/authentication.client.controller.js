'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator', 'Organizations', 'Notification',
  function ($scope, $state, $http, $location, $window, Authentication, PasswordValidator, Organizations, Notification) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    $http.get('/api/organizations-basic')
    .then(function(res) {
      $scope.organizations = res.data;
    })
    .catch(function(err) {
      console.log('error fetching organizations', err);
    });

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $scope.credentials.inviteToken = $state.params.i;
      $http.post('/api/auth/signup', $scope.credentials).then(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response.data;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).catch(function (response) {
        $scope.error = response.data.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).then(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response.data;

        // User should be notified if they have not submitted a review yet
        if($scope.authentication.user.reviews.length === 0) {
          Notification.primary({
            message: 'You have not written a review yet. Write your first review.',
            delay: null
          });
        }

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).catch(function (response) {
        $scope.error = response.data.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);
