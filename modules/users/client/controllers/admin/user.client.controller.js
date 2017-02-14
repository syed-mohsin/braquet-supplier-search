'use strict';

angular.module('users.admin').controller('UserController', ['$scope', '$state', '$http', 'Authentication', 'userResolve',
  function ($scope, $state, $http, Authentication, userResolve) {
    $scope.authentication = Authentication;
    $scope.user = userResolve;

    $scope.remove = function (user) {
      if (confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          $scope.users.splice($scope.users.indexOf(user), 1);
        } else {
          $scope.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    };

    $scope.verifyUser = function() {
      if (!$scope.user.verified) {
        $http.post('/api/users/' + $scope.user._id + '/verify')
          .success(function(user) {
            $state.reload();
          })
          .error(function(err) {
            console.log(err);
          });
      }
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = $scope.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);
