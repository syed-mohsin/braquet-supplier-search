'use strict';

// Organizations controller

angular.module('organizations').controller('OrganizationsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$modal', 'FileUploader', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Organizations',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $modal, FileUploader, Authentication, Socket, GetBids, PanelModels, Projects, Organizations) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    $scope.loadPanelModelsData = function() {
      $scope.panel_models = [];

      $scope.panelData = PanelModels.query();

      $scope.getMatches = function (text) {
        var filteredItems = $filter('filter')($scope.panelData, {
          $: text
        });

        return filteredItems;
      };
    };

    // Add new organization
    $scope.create = function (isValid) {
      $scope.error = null;

      // Check for form submission errors
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'organizationForm');

        return false;
      }

      // Create new Organization object
      var organization = new Organizations({
        companyName: this.companyName,
        urlName: this.urlName,
        isManufacturer: this.isManufacturer,
        industry: this.industry,
        productTypes: this.productTypes,
        panel_models: this.panel_models,
        url: this.url,
        address1: this.address1,
        address2: this.address2,
        city: this.city,
        state: this.state,
        zipcode: this.zipcode,
        country: this.country,
        about: this.about,
        standardPaymentTerms: this.standardPaymentTerms,
        outsourceDelivery: this.outsourceDelivery,
        bankability: this.bankability
      });

      // Redirect after save
      organization.$save(function (response) {
        $state.go('organizations.view', {
          organizationId: response._id
        });

      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'organizationForm');

        return false;
      }

      var organization = $scope.organization;
      // unnecessary fields that cause the request body to become huge
      delete organization.reviews;
      delete organization.priceReviews;

      organization.$update(function () {
        $state.go('organizations.view', {
          organizationId: organization._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function (organization) {
      if (confirm('Are you sure you want to delete this organization?')) {
        if (organization) {
          organization.$remove();

          $scope.organizations.splice($scope.organizations.indexOf(organization), 1);
        } else {
          $scope.organization.$remove(function () {
            $state.go('organizations');
          });
        }
      }
    };

    // Find a list of ALL Organizations
    $scope.find = function () {
      Organizations.query({}, function(organizations) {
        $scope.organizations = organizations;
        $scope.buildPager();
      });
    };

    $scope.findOne = function () {
      Organizations.get({
        organizationId: $stateParams.organizationId
      }, function(organization) {
        $scope.organization = organization;
      }, function(error) {
        $location.path('/forbidden');
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.organizations, {
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

  }]);
