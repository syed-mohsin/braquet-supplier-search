'use strict';

// Bids controller
angular.module('bids').controller('BidsController', ['$scope', '$stateParams', '$location', '$interval', '$filter', 'Authentication', 'Bids',
  function ($scope, $stateParams, $location, $interval, $filter, Authentication, bids) {
    $scope.authentication = Authentication;

    // Create new bid
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'bidForm');

        return false;
      }

      // Create new Bid object
      var bid = new Bids({
        fob_shipping: this.fob_shipping,
        delivery_date: this.delivery_date,
        bid_price: this.bid_price,
        panel_wattage: this.panel_wattage,
        manufacturer: this.manufacturer
      });

      // Redirect after save
      bid.$save(function (response) {
        $location.path('bids/' + response._id);

        // Clear form fields
        $scope.fob_shipping = '';
        $scope.delivery_date = '';
        $scope.bid_price = '';
        $scope.panel_wattage = '';
        $scope.manufacturer = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Bid
    $scope.remove = function (bid) {
      if (bid) {
        bid.$remove();

        for (var i in $scope.bids) {
          if ($scope.bids[i] === bid) {
            $scope.Bids.splice(i, 1);
          }
        }
      } else {
        $scope.bid.$remove(function () {
          $location.path('bids');
        });
      }
    };

    // Find a list of ALL Bids
    $scope.find = function () {
      $scope.bids = Bids.query();
    };

    // Find a list of MY Bids
    $scope.findMybids = function () {
      $scope.bids = Bids.query({}, function(bids) {
        
        // delete bids that don't have the same user id as current user
        for (var i=$scope.bids.length-1; i>=0;i--)
          if ($scope.bids[i].user._id !== Authentication.user._id)
            $scope.bids.splice(i,1);
      });
    };

    // Find existing Bid
    $scope.findOne = function () {
      $scope.bid = Bids.get({
        bidId: $stateParams.bidId
      });
    };
  }
]);