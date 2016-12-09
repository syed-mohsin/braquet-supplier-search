'use strict';

// Bids controller
angular.module('bids').controller('BidsController', ['$scope', '$stateParams', '$resource', '$location', '$interval', '$filter', 'Authentication', 'Socket', 'Projects', 'StoreBid', 'Bids',
  function ($scope, $stateParams, $resource, $location, $interval, $filter, Authentication, Socket, Projects, StoreBid, Bids) {
    $scope.authentication = Authentication;

    // Connect socket
    if (!Socket.socket) {
      Socket.connect();
      console.log("connected to server");
    }

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('chatMessage');
    });

    Socket.on('refreshBidList', function(msg) {
      if (Authentication.user.roles[0] === 'seller' && 
            $location.url() === '/bids') {
        $scope.findMyBids();
      }
    });

    // Create new bid
    $scope.create = function (isValid) {
      $scope.error = null;

      // Check that bid deadline has not passed
      if (new Date() > new Date($scope.project.bid_deadline)) {
        $scope.error = 'Bid Deadline has passed';
        
        return false;
      }

      // Check for form submission errors
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'bidForm');

        return false;
      }

      // Create new Bid object
      var bid = new Bids({
        fob_shipping: this.fob_shipping,
        delivery_date: this.date.value,
        bid_price: this.bid_price * 100, // must be an integer when inputting to mongoose currency model
        project: $scope.project._id,
        project_title: $scope.project.title
      });

      // Redirect after save
      bid.$save(function (response) {
        // should only get here if valid response
        // ---------------------------------------

        // Associate bid with project
        // need error checking here and CRITICAL:
        // must be an atomic operation with saving bid
        StoreBid.update({
          projectId: $scope.project._id, 
          bidId: response._id}, 
          null
        );

        // redirect to view bid
        $location.path('bids/' + response._id);

        // Clear form fields
        $scope.fob_shipping = '';
        $scope.delivery_date = '';
        $scope.bid_price = '';
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
    $scope.findMyBids = function () {
      $scope.bids = Bids.query({}, function(bids) {
        
        // delete bids that don't have the same user id as current user
        for (var i=$scope.bids.length-1; i>=0;i--)
          if ($scope.bids[i].user._id !== Authentication.user._id)
            $scope.bids.splice(i,1);
      });
    };

    // Find existing Bid and it's associated project
    $scope.findOne = function () {
      $scope.bid = Bids.get({bidId: $stateParams.bidId}, 
        function(bid) {
  
      }, function(error) {
        $location.path('/forbidden');
      });
    };

    // Find existing Project
    $scope.findProject = function () {
      $scope.project = Projects.get({
        projectId: $stateParams.projectId
      });
    };

    $scope.createDate = function() {
      $scope.date = {
        value: new Date(),
        currentDate: new Date(),
        threeYearAheadDate: new Date().setFullYear(new Date().getFullYear() + 3)
      };
    };
  }
]);
