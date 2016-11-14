'use strict';

// Projects controller

angular.module('projects').controller('ProjectsController', ['$scope', '$stateParams', '$location', '$timeout', '$interval', '$filter', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects',
  function ($scope, $stateParams, $location, $timeout, $interval, $filter, Authentication, Socket, GetBids, PanelModels, Projects) {
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

    Socket.on('refreshProjectView', function(project_id) {
     if ($stateParams.projectId === project_id) {
        $scope.findOne();
      }
    });

    Socket.on('refreshProjectList', function(msg) {
      if (Authentication.user.roles[0] === 'seller' && 
            $location.url() === '/projects') {
        $scope.find();
      }
    });

    // Create new Project
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'projectForm');

        return false;
      }

      // Create new Project object
      var project = new Projects({
        title: this.title,
        system_capacity: this.system_capacity,
        bid_deadline: this.bid_date.value,
        shipping_address: this.shipping_address,
        panel_models: this.panel_models
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

    // Find a list of MY projects
    $scope.findMyProjects = function () {
      $scope.projects = Projects.query({}, function(projects) {
        var currentDate = new Date();

        // add a boolean to see if possible to bid on project
        projects.forEach(function(project) {
          project.canBid = $scope.authentication.user.roles[0] === 'seller' && currentDate < new Date(project.bid_deadline);
          project.bidOpen = (currentDate < new Date(project.bid_deadline));
        });

        // delete projects that don't have the same user id as current user
        for (var i=$scope.projects.length-1; i>=0;i--) 
          if ($scope.projects[i].user === null || $scope.projects[i].user._id  !== Authentication.user._id)
            $scope.projects.splice(i,1);
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
      });
      // this line was used to independently retrieve the associated bids, but was replaced after
      // bids were 'deep populated' into the project
      // $scope.bids = GetBids.query({projectId: project._id}, function(bids)
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
