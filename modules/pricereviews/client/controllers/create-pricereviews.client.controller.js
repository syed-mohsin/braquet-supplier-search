'use strict';

// Price Reviews controller
angular.module('pricereviews').controller('CreatePriceReviewsController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'PriceReviews', 'modalOrganizationId',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, PriceReviews, modalOrganizationId) {
    $scope.authentication = Authentication;

    // Create new Price Review
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reviewForm');

        return false;
      }

      // Create new Price Review object
      var priceReview = {
        price: this.price * 100,
        quantity: this.quantity,
        panelType: this.panelType,
        shippingLocation: this.shippingLocation
      };

      // Redirect after save
      $http.post('/api/pricereviews/create/' + modalOrganizationId, priceReview)
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
