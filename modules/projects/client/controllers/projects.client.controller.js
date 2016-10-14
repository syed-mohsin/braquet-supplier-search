'use strict';

// Projects controller
angular.module('projects').controller('ProjectsController', ['$scope', '$stateParams', '$location', '$interval', '$filter', 'Authentication', 'GetBids', 'Projects',
  function ($scope, $stateParams, $location, $interval, $filter, Authentication, GetBids, Projects) {
    $scope.authentication = Authentication;

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
        bid_deadline: this.bid_deadline,
        shipping_address: this.shipping_address,
        panel_wattage: this.panel_wattage,
        panel_type: this.panel_type
      });

      // Redirect after save
      project.$save(function (response) {
        $location.path('projects/' + response._id);

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
      $scope.projects = Projects.query();
    };

    // Find a list of MY projects
    $scope.findMyProjects = function () {
      $scope.projects = Projects.query({}, function(projects) {
        
        // delete projects that don't have the same user id as current user
        for (var i=$scope.projects.length-1; i>=0;i--)
          if ($scope.projects[i].user._id  !== Authentication.user._id)
            $scope.projects.splice(i,1);
      });
    };

    // Find existing Project
    $scope.findOne = function () {
      $scope.project = Projects.get({
        projectId: $stateParams.projectId
      }, function(project) {
        // get details of all bids associated with current project
        $scope.bids = GetBids.query({projectId: project._id});
      });
    };
  }
]);
