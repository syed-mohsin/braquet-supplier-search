'use strict';

// Reviews controller
angular.module('reviews').controller('CreateReviewsController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'Reviews', 'modalOrganizationId',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, Reviews, modalOrganizationId) {
    $scope.authentication = Authentication;
    $scope.anonymous = true; // all created reviews should be anonymous by default

    // Create new Review
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reviewForm');

        return false;
      }

      // Create new Review object
      var review = new Reviews({
        title: this.title,
        category: this.category,
        rating: this.rating,
        content: this.content,
        anonymous: this.anonymous
      });

      // Redirect after save
      $http.post('/api/reviews/create/' + modalOrganizationId, review)
        .success(function (response) {
          $modalInstance.close();
        })
        .error(function (errorResponse) {
          if (errorResponse && errorResponse.message) {
            $scope.error = errorResponse.message;
          }
          else {
            $scope.error = 'Something went wrong...';
          }
        });
    };
  }
]);
