'use strict';

// Reviews controller
angular.module('pricereviews').controller('PriceReviewsController', ['$rootScope', '$scope', '$state', '$stateParams', '$location', '$http', '$mdDialog', 'Authentication', 'PriceReviews',
  function ($rootScope, $scope, $state, $stateParams, $location, $http, $mdDialog, Authentication, PriceReviews) {
    $scope.authentication = Authentication;
    $scope.shouldShowPrices = true;

    // SEO metadata
    $rootScope.title = 'Quotes - Braquet';
    $rootScope.description = 'Braquet - See all your quotes';

    $scope.showReviews = function() {
      $state.go('reviews.list');
    };

    // Remove existing Price Review
    $scope.remove = function (priceReview) {
      var confirm = $mdDialog.confirm({ onComplete: function afterShowAnimation() {
        var $dialog = angular.element(document.querySelector('md-dialog'));
        var $actionsSection = $dialog.find('md-dialog-actions');
        var $cancelButton = $actionsSection.children()[0];
        var $confirmButton = $actionsSection.children()[1];
        angular.element($confirmButton).removeClass('md-focused');
        angular.element($cancelButton).addClass('md-focused');
        $cancelButton.focus();
      } })
        .title('Are you sure you want to delete this price review?')
        .clickOutsideToClose(true)
        .ok('Yes')
        .cancel('No');

      $mdDialog.show(confirm).then(function() {
        if (priceReview) {
          priceReview.$remove();

          for (var i in $scope.priceReviews) {
            if ($scope.priceReviews[i] === priceReview) {
              $scope.priceReviews.splice(i, 1);
            }
          }
        } else {
          $scope.priceReview.$remove(function () {
            $location.path('pricereviews');
          });
        }
      }, function() {
        // do nothing
      });
    };

    // Update existing Price Review
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'priceReviewForm');

        return false;
      }

      var priceReview = $scope.priceReview;

      priceReview.$update(function () {
        $location.path('pricereviews/' + priceReview._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of User Price Reviews
    $scope.find = function () {
      $scope.priceReviews = PriceReviews.query();
    };

    // Find a list of All Price Reviews
    $scope.adminFind = function () {
      $http.get('/api/pricereviews-admin-list')
      .then(function(priceReviews) {
        $scope.priceReviews = priceReviews.data;
      })
      .catch(function(err) {
        console.log(err);
      });
    };

    // Find existing Price Review
    $scope.findOne = function () {
      PriceReviews.get({
        priceReviewId: $stateParams.priceReviewId
      }, function(priceReview) {
        $scope.priceReview = priceReview;
      }, function(error) {
        $location.path('/forbidden');
      });
    };
  }
]);
