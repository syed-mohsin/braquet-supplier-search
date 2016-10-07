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
        title: this.title,
        system_capacity: this.system_capacity,
        bid_deadline: this.bid_deadline,
        shipping_address: this.shipping_address,
        panel_wattage: this.panel_wattage,
        panel_type: this.panel_type
      });

      // Redirect after save
      bid.$save(function (response) {
        $location.path('bids/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.system_capacity = '';
        $scope.bid_deadline = '';
        $scope.shipping_address = '';
        $scope.panel_wattage = '';
        $scope.panel_type = '';
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
