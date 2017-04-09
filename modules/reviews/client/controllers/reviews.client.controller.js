'use strict';

// Reviews controller
angular.module('reviews').controller('ReviewsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Reviews', 'Notification',
  function ($scope, $stateParams, $location, $http, Authentication, Reviews, Notification) {
    $scope.authentication = Authentication;

    // Remove existing Review
    $scope.remove = function (review) {
      if (review) {
        review.$remove();

        for (var i in $scope.reviews) {
          if ($scope.reviews[i] === review) {
            $scope.reviews.splice(i, 1);
          }
        }
      } else {
        $scope.review.$remove(function () {
          Notification.primary('Successully Deleted Review');
          $location.path('reviews');
        }, function() {
          Notification.error('Failed to Delete Review');
        });
      }
    };

    // Update existing Review
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reviewForm');

        return false;
      }

      var review = $scope.review;

      review.$update(function () {
        $location.path('reviews/' + review._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of User Reviews
    $scope.find = function () {
      $scope.reviews = Reviews.query();
    };

    // Find a list of All Reviews
    $scope.adminFind = function () {
      $http.get('/api/reviews-admin-list')
      .then(function(reviews) {
        $scope.reviews = reviews.data;
      })
      .catch(function(err) {
        console.log(err);
      });
    };

    // Find existing Review
    $scope.findOne = function () {
      $scope.review = Reviews.get({
        reviewId: $stateParams.reviewId
      });
    };
  }
]);
