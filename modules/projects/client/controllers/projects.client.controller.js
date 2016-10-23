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
        $scope.bid_date = {
          currentDate: new Date(),
          yearAheadDate: new Date().setFullYear(new Date().getFullYear() + 1)
        };
      });
      // this line was used to independently retrieve the associated bids, but was replaced after
      // bids were simply 'deep populated' into the project
      // $scope.bids = GetBids.query({projectId: project._id}, function(bids)
    };

    $scope.myDta = [{
          value: "AXI plus SE black (poly)",
          display: "AXI plus SE black (poly)"
      }, {
          value: "AXIblackpremium",
          display: "AXIblackpremium"
      }, {
          value: "CP60 250SW",
          display: "CP60 250SW"
      }, {
          value: "Apollo II Solar Roofing System",
          display: "Apollo II Solar Roofing System"
      }, {
          value: "FS-4117-2, FS-4117A-2",
          display: "FS-4117-2, FS-4117A-2"
      }, {
          value: "Q.PRO BFR-G4 265W",
          display: "Q.PRO BFR-G4 265W"
      }, {
          value: "Peak Energy 72 Series",
          display: "Peak Energy 72 Series"
      }, {
          value: "MJE265HD",
          display: "MJE265HD"
      }, {
          value: "OPT325-72-4-100",
          display: "OPT325-72-4-100"
      }, {
          value: "HyPro STP290S-20/Wew",
          display: "HyPro STP290S-20/Wew"
      }, {
          value: "TSM-265PD05.082",
          display: "TSM-265PD05.082"
      }, {
          value: "UP-M250P-T",
          display: "UP-M250P-T"
      }, {
          value: "Eldora VSP.60.250.03",
          display: "Eldora VSP.60.250.03"
    }];

    $scope.getMatches = function (text) {
      var ret = $scope.myDta.filter(function (d) {
        return d.display.startsWith(text);
      });

      return ret;
    };

    $scope.createDate = function() {
      $scope.bid_date = {
        value: new Date(),
        currentDate: new Date(),
        yearAheadDate: new Date().setFullYear(new Date().getFullYear() + 1)
      };
    };
  }
]);
