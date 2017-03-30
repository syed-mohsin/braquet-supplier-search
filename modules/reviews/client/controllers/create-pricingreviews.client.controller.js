'use strict';

// Reviews controller
angular.module('reviews').controller('CreatePricingReviewsController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'Reviews', 'modalOrganizationId',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, Reviews, modalOrganizationId) {
    $scope.authentication = Authentication;

    // Create new Pricing Review
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reviewForm');

        return false;
      }

      // Create new Pricing Review object
      var pricingReview = {
        price: this.price * 100,
        quantity: this.quantity,
        panelType: this.panelType,
        shippingLocation: this.shippingLocation
      };

      // Redirect after save
      $http.post('/api/pricingreviews/create/' + modalOrganizationId, pricingReview)
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
