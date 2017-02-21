'use strict';

// Projects controller

angular.module('projects').controller('ProjectsController', ['$scope', '$state', '$stateParams', '$location', '$timeout', '$interval', '$filter', '$modal', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects',
  function ($scope, $state, $stateParams, $location, $timeout, $interval, $filter, $modal, Authentication, Socket, GetBids, PanelModels, Projects) {
    $scope.authentication = Authentication;

    // Connect socket
    if (!Socket.socket) {
      Socket.connect();
      console.log('connected to server');
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
      console.log('Bid has terminated');
      console.log(project_id);
      console.log('State param is: ' + $stateParams.projectId);

      if ($scope.project && $stateParams.projectId === project_id) {
        $scope.project.canBid = false;
        $scope.project.bidOpen = false;
        console.log('WE ARE IN PROJECT VIEW');
      }

      else if ($location.url() === '/projects' && $scope.projects) {
        console.log('WE ARE IN PROJECT LIST');
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
        $scope.error = 'At least one panel model is required';
        return false;
      }

      // Create new Project object
      var project = new Projects({
        title: this.title,
        quantity: this.quantity,
        bid_deadline: this.bid_date.value,
        panel_models: this.panel_models,
        project_state: this.project_state,
        shipping_address_1: this.shipping_address_1,
        shipping_address_2: this.shipping_address_2,
        shipping_address_city: this.shipping_address_city,
        shipping_address_state: this.shipping_address_state,
        shipping_address_zip_code: this.shipping_address_zip_code,
        shipping_address_country: this.shipping_address_country,
        preferred_payment_term: this.preferred_payment_term
      });

      // Redirect after save
      project.$save(function (response) {
        $location.path('projects/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.quantity = '';
        $scope.bid_deadline = '';
        $scope.shipping_address_1 = '';
        $scope.shipping_address_2 = '';
        $scope.shipping_address_city = '';
        $scope.shipping_address_state = '';
        $scope.shipping_address_zip_code = '';
        $scope.shipping_address_country = '';
        $scope.preferred_payment_term = '';
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
        $scope.error = 'At least one panel model is required';
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
    $scope.showBidView = function(ev, projectId) {
      console.log(ev);
      console.log($state.href('bids.create', { projectId: $stateParams.projectId }, { absolute: true, inherit: false }));
      console.log(angular.element);
      var modalInstance = $modal.open({
        templateUrl: '/modules/bids/client/views/create-bid.client.view.html',
        controller: 'CreateBidController',
        resolve: {
          modalProjectId: function() {
            return projectId;
          }
        },
        windowClass: 'app-modal-window'
      });

      modalInstance.result.then(function() {
        if (projectId) {
          $scope.find();
        } else {
          $scope.findOne();
        }
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
      });
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
      var filteredItems = $filter('filter')($scope.myDta, {
        $: text
      });

      return filteredItems;
    };

    $scope.createDate = function() {
      $scope.panel_models = [];
      var min = new Date();

      var now = new Date();
      now.setDate(now.getDate() + 1);

      var max = new Date();
      max.setFullYear(max.getFullYear() + 1);

      $scope.bid_date = {
        value: now,
        currentDate: min,
        yearAheadDate: max
      };
    };
  }
]);
