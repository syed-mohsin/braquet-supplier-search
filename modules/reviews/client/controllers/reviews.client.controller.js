'use strict';

// Reviews controller
angular.module('reviews').controller('ReviewsController', ['$scope', '$state', '$stateParams', '$location', '$http', '$mdDialog', 'Authentication', 'Reviews',
  function ($scope, $state, $stateParams, $location, $http, $mdDialog, Authentication, Reviews) {
    $scope.authentication = Authentication;
    $scope.shouldShowReviews = true;

    // showPrices
    $scope.showPrices = function() {
      $state.go('pricereviews.list');
    };

    // Remove existing Review
    $scope.remove = function (review) {
      var confirm = $mdDialog.confirm({ onComplete: function afterShowAnimation() {
        var $dialog = angular.element(document.querySelector('md-dialog'));
        var $actionsSection = $dialog.find('md-dialog-actions');
        var $cancelButton = $actionsSection.children()[0];
        var $confirmButton = $actionsSection.children()[1];
        angular.element($confirmButton).removeClass('md-focused');
        angular.element($cancelButton).addClass('md-focused');
        $cancelButton.focus();
      } })
        .title('Are you sure you want to delete this review?')
        .clickOutsideToClose(true)
        .ok('Yes')
        .cancel('No');

      $mdDialog.show(confirm).then(function() {
        if (review) {
          review.$remove();

          for (var i in $scope.reviews) {
            if ($scope.reviews[i] === review) {
              $scope.reviews.splice(i, 1);
            }
          }
        } else {
          $scope.review.$remove(function () {
            $location.path('reviews');
          });
        }
      }, function() {
        // do nothing
      });
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
