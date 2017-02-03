'use strict';

// Projects controller

angular.module('projects').controller('ProjectsController', ['$scope', '$state', '$stateParams', '$location', '$timeout', '$interval', '$filter', '$modal', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects',
  function ($scope, $state, $stateParams, $location, $timeout, $interval, $filter, $modal, Authentication, Socket, GetBids, PanelModels, Projects) {
    $scope.authentication = Authentication;

    // Connect socket
    if (!Socket.socket) {
      Socket.connect();
      console.log("connected to server");
    }

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('refreshProjectView');
      Socket.removeListener('refreshProjectList');
    });

    Socket.on('refreshProjectView', function(project_id) {
     if ($stateParams.projectId === project_id) {
        $scope.findOne();
      }
    });

    Socket.on('refreshProjectList', function(user_id) {
      if (Authentication.user.roles[0] === 'seller' && 
            $location.url() === '/projects') {
        $scope.find();
      }
      else if (Authentication.user._id === user_id) {
        $scope.find();
      }
    });

    Socket.on('bidDeadlineList', function(project_id) {
      console.log("Bid has terminated");
      console.log(project_id);
      console.log("State param is: " + $stateParams.projectId);

      if ($stateParams.projectId === project_id) {
        $scope.project.canBid = false;
        $scope.project.bidOpen = false;
        console.log("WE ARE IN PROJECT VIEW");
      }

      else if ($location.url() === '/projects') {
        console.log("WE ARE IN PROJECT LIST");
        for(var i=0;i<$scope.projects.length;i++) {
          if ($scope.projects[i]._id === project_id) {
            $scope.projects[i].canBid = false;
            $scope.projects[i].bidOpen = false;
            return;
          }
        }
      }
    });

    // Create new Project
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'projectForm');

        return false;
      }

      if (!$scope.panel_models.length) {
        $scope.error = "At least one panel model is required";
        return false;
      }

      // Create new Project object
      var project = new Projects({
        title: this.title,
        system_capacity: this.system_capacity,
        bid_deadline: this.bid_date.value,
        shipping_address: this.shipping_address,
        panel_models: this.panel_models,
        project_state: this.project_state
      });

      // Redirect after save
      project.$save(function (response) {
        $location.path('projects/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.system_capacity = '';
        $scope.bid_deadline = '';
        $scope.shipping_address = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Project
    $scope.remove = function (project) {
      if (project) {
        project.$remove();

        for (var i in $scope.projects) {
          if ($scope.projects[i] === project) {
            $scope.Projects.splice(i, 1);
          }
        }
      } else {
        $scope.project.$remove(function () {
          $location.path('projects');
        });
      }
    };

    // Update existing Project
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!$scope.project.panel_models.length) {
        $scope.error = "At least one panel model is required";
        return false;
      }

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'projectForm');

        return false;
      }

      var project = $scope.project;

      project.$update(function () {
        $location.path('projects/' + project._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // popup dialog that allows user to place a bid
    $scope.showBidView = function(ev) {
      console.log(ev);
      console.log($state.href('bids.create', {projectId: $stateParams.projectId}, {absolute: true, inherit: false}));
      console.log(angular.element);
      var modalOpen = $modal.open({
        templateUrl: '/modules/bids/client/views/create-bid.client.view.html',
        windowClass: 'app-modal-window'
      });

      modalOpen.result.then(function(result) {
        console.log("RESULT", result);
      });
    };

    // popup dialog that allows project owner to invite bidders on private project
    $scope.showAddBidders = function(ev) {
      console.log(ev);
      if ($scope.project.project_state !== 'private') return false;

      var modalInstance = $modal.open({
        templateUrl: '/modules/projects/client/views/add-bidders.client.view.html',
        windowClass: 'app-modal-window',
        controller: function($scope, $http, $modalInstance) {
          $scope.addedBidders = [];
          $scope.potentialBidders = $scope.project.user.connections.slice();

          $scope.buildPager = function () {
            $scope.pagedItems = [];
            $scope.itemsPerPage = 15;
            $scope.currentPage = 1;
            $scope.figureOutItemsToDisplay();
          };

          $scope.figureOutItemsToDisplay = function () {
            $scope.filteredItems = $filter('filter')($scope.potentialBidders, {
              $: $scope.search
            });
            $scope.filterLength = $scope.filteredItems.length;
            var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
            var end = begin + $scope.itemsPerPage;
            $scope.pagedItems = $scope.filteredItems.slice(begin, end);
          };

          $scope.pageChanged = function () {
            $scope.figureOutItemsToDisplay();
          };

          // for pagination
          $scope.buildPager();

          $scope.toggle = function(connection) {
            var potentialBiddersIndexOf = $scope.potentialBidders.indexOf(connection);
            var addedBiddersIndexOf = $scope.addedBidders.indexOf(connection);

            // move connection to addedBidders array
            if (potentialBiddersIndexOf !== -1 && addedBiddersIndexOf === -1) {
              $scope.addedBidders.push($scope.potentialBidders.splice(potentialBiddersIndexOf, 1)[0]);
            // remove connection from addedBidders and move back to connections
            } else if (potentialBiddersIndexOf === -1 && addedBiddersIndexOf !== -1) {
              $scope.potentialBidders.push($scope.addedBidders.splice(addedBiddersIndexOf, 1)[0]);
            }

            $scope.figureOutItemsToDisplay();
          };

          $scope.acceptBidders = function() {
            $http.post('/api/projects/' + $scope.project._id + '/inviteBidders', $scope.addedBidders)
              .success(function (response) {
              $modalInstance.close();

            }).error(function (response) {
              // Show user error message and clear form
              $scope.error = response.message;
            });
          };
        },
        scope: $scope
      });

      modalInstance.result.then(function() {
        $scope.findOne();
      })
    };

    // Find a list of ALL Projects
    $scope.find = function () {
      $scope.projects = Projects.query({}, function(projects) {
        var currentDate = new Date();

        // add a boolean to see if possible to bid on project
        projects.forEach(function(project) {
          project.canBid = $scope.authentication.user.roles[0] === 'seller' && currentDate < new Date(project.bid_deadline);
          project.bidOpen = (currentDate < new Date(project.bid_deadline));
        });
      });
    };

    // Find existing Project
    $scope.findOne = function () {
      $scope.project = Projects.get({
        projectId: $stateParams.projectId
      }, function(project) {
        $scope.project.bid_deadline = new Date(project.bid_deadline);
        $scope.project.canBid = ($scope.authentication.user.roles[0] === 'seller') && (new Date() < new Date(project.bid_deadline));
        $scope.project.bidOpen = (new Date() < new Date(project.bid_deadline));
        $scope.bid_date = {
          currentDate: new Date(),
          yearAheadDate: new Date().setFullYear(new Date().getFullYear() + 1)
        };
      }, function(error) {
        $location.path('/forbidden');
      });
    };

    $scope.myDta = PanelModels.query();

    $scope.getMatches = function (text) {
      var ret = $scope.myDta.filter(function (d) {
        return d.model.startsWith(text);
      });

      return ret;
    };

    $scope.createDate = function() {
      $scope.panel_models = [];
      $scope.bid_date = {
        value: new Date(),
        currentDate: new Date(),
        yearAheadDate: new Date().setFullYear(new Date().getFullYear() + 1)
      };
    };
  }
]);
