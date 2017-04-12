'use strict';

// Price Reviews controller
angular.module('pricereviews').controller('CreatePriceReviewsController', ['$scope', '$stateParams', '$location', '$http', '$filter', '$modalInstance', 'Authentication', 'PriceReviews', 'modalOrganization',
  function ($scope, $stateParams, $location, $http, $filter, $modalInstance, Authentication, PriceReviews, modalOrganization) {
    $scope.authentication = Authentication;
    $scope.currentDate = new Date();
    modalOrganization.manufacturers.push('other');

    $http.get('/api/panelmodels-wattages')
    .then(function(response) {
      var wattages = response.data.sort(function(a,b) { return a-b; });
      $scope.minStcPower = wattages[0];
      $scope.maxStcPower = wattages[wattages.length-1];
    });

    $http.get('/api/panelmodels-manufacturers')
    .then(function(response) {
      $scope.otherBrands = response.data.filter(function(brand) {
        return modalOrganization.manufacturers.indexOf(brand) === -1;
      });
    });

    // Create new Price Review
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'priceReviewForm');

        return false;
      }

      // verify includes shipping was selected
      if (!this.includesShipping) {
        $scope.error = 'Please specify if shipping was included';
        return false;
      }

      // verify shippingLocation is specified if so indicated
      if (this.includesShipping === 'true' && !this.shippingLocation) {
        $scope.error = 'Please select a shipping location';
        return false;
      }

      // verify correct brand was selected
      if (modalOrganization.manufacturers.indexOf(this.manufacturer) === -1 &&
          $scope.otherBrands.indexOf(this.otherManufacturer) === -1) {
        $scope.error = 'Please select a valid brand';
        return false;
      }

      // Create new Price Review object
      console.log(this.otherManufacturer);
      var priceReview = {
        quoteDate: this.quoteDate,
        deliveryDate: this.deliveryDate,
        stcPower: this.stcPower,
        manufacturer: this.manufacturer !== 'other' ? this.manufacturer : this.otherManufacturer,
        price: this.price * 100,
        quantity: this.quantity,
        panelType: this.panelType,
        includesShipping: this.includesShipping === 'true' ? true : false,
        shippingLocation: this.includesShipping === 'true' ? this.shippingLocation : undefined
      };

      // Redirect after save
      $http.post('/api/pricereviews/create/' + modalOrganization._id, priceReview)
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

    $scope.search = function(searchManufacturerText) {
      return $filter('filter')(modalOrganization.manufacturers, {
        $: searchManufacturerText
      });
    };
  }
]);
