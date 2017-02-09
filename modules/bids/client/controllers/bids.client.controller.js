'use strict';

// Bids controller
angular.module('bids').controller('BidsController', ['$scope', '$stateParams', '$resource', '$location', '$interval', '$filter', 'Authentication', 'Socket', 'Projects', 'Bids',
  function ($scope, $stateParams, $resource, $location, $interval, $filter, Authentication, Socket, Projects, Bids) {
    $scope.authentication = Authentication;
    $scope.bids = Bids.query();
    $scope.panel_models = [];

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
      var id = $stateParams.projectId;
      $scope.project = Projects.get({
        projectId: id
      });
    };

    $scope.createDate = function() {
      $scope.date = {
        value: new Date(),
        currentDate: new Date(),
        threeYearAheadDate: new Date().setFullYear(new Date().getFullYear() + 3)
      };
    };

    $scope.getMatches = function (text) {
      var filteredItems = $filter('filter')($scope.project.panel_models, {
        $: text
      });

      return filteredItems;
    };
  }
]);
