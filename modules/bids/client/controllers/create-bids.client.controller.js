'use strict';

// Bids controller
angular.module('bids').controller('CreateBidController', ['$scope', '$stateParams', '$resource', '$location', '$interval', '$filter', '$modalInstance', 'Authentication', 'Socket', 'Projects', 'Bids', 'modalProjectId',
  function ($scope, $stateParams, $resource, $location, $interval, $filter, $modalInstance, Authentication, Socket, Projects, Bids, modalProjectId) {
    $scope.authentication = Authentication;
    $scope.panel_models = [];

    // Create new bid
    $scope.create = function (isValid) {
      $scope.error = null;

      // Check that bid deadline has not passed
      if (new Date() > new Date($scope.project.bid_deadline)) {
        $scope.error = 'Bid Deadline has passed';

        return false;
      }

      // check panel_models length
      if (!this.panel_models.length) {
        $scope.error = 'Please select at least one panel model';

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
        quantity: this.quantity,
        panel_models: this.panel_models,
        subtotal: this.subtotal * 100, // must be an integer when inputting to mongoose currency model
        shipping_cost: this.shipping_cost * 100,
        sales_tax: this.sales_tax * 100,
        payment_term: this.payment_term,
        project: $scope.project._id,
        project_title: $scope.project.title
      });

      // Redirect after save
      bid.$save(function (response) {

        // close modal
        $modalInstance.close();

        // redirect to view bid
        // $location.path('bids/' + response._id);

        // Clear form fields
        $scope.fob_shipping = '';
        $scope.delivery_date = '';
        $scope.subtotal = '';
        $scope.sales_tax = '';
        $scope.quantity = '';
        $scope.panel_models = null;
        $scope.shipping_cost = '';
        $scope.payment_term = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find existing Bid and it's associated project
    $scope.findOne = function () {
      $scope.bid = Bids.get({ bidId: $stateParams.bidId },
        function(bid) {

        }, function(error) {
          $location.path('/forbidden');
        });
    };

    // Find existing Project
    $scope.findProject = function () {
      var id = modalProjectId || $stateParams.projectId;
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
