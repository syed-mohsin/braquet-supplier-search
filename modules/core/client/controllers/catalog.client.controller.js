'use strict';

angular.module('core').controller('CatalogController', ['$scope', '$filter', '$http', '$state', '$stateParams', '$modal', 'Authentication', 'PanelModels', 'EmailNotifications', 'Notification', '$analytics',
  function ($scope, $filter, $http, $state, $stateParams, $modal, Authentication, PanelModels, EmailNotifications, Notification, $analytics) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.resolvedResources = 0;
    $scope.expectedResources = 4;
    $scope.search = $stateParams.q;

    $scope.query = {};
    $scope.query.q = $stateParams.q;
    $scope.query.man = $stateParams.man;
    $scope.query.pow = $stateParams.pow;
    $scope.query.crys = $stateParams.crys;
    $scope.query.color = $stateParams.color;
    $scope.query.cells = $stateParams.cells;
    $scope.query.locs = $stateParams.locs;
    $scope.query.page = $stateParams.page;
    $stateParams.quantity = $stateParams.quantity ? $stateParams.quantity : '0kW-100kW';
    $scope.query.quantity = $stateParams.quantity;
    $scope.quantity = $scope.query.quantity;
    $scope.query.price = $stateParams.price;
    $scope.query.isman = $stateParams.isman;
    $scope.query.isreseller = $stateParams.isreseller;

    // used to toggle filter on xs screen size
    $scope.hiddenFilterClass = 'hidden-xs';

    $scope.showBrandIfMatchingLocation = function(brand, organization) {
      var matchingPanels = organization.panel_models.filter(function(panel) {
        return panel.manufacturer === brand;
      });

      var isValidBrandByLocation = matchingPanels.some(function(panel) {
        return panel.manufacturingLocations.some(function(location) {
          return $scope.query.locs.indexOf(location) !== -1;
        });
      });

      return isValidBrandByLocation;
    };

    $scope.showBrand = function(brand, organization) {
      return (!$scope.query.man || $scope.query.man.indexOf(brand) !== -1) &&
             (!$scope.query.locs || $scope.showBrandIfMatchingLocation(brand, organization));
    };

    $scope.showModule = function(organization, type) {
      if ((!$scope.query.crys &&
           organization.panel_crystalline_types.indexOf(type) !== -1) ||
          (organization.panel_crystalline_types.indexOf(type) !== -1 &&
           $scope.query.crys.indexOf(type) !== -1)) {

        return true;
      }

      return false;
    };

    // show following conditional
    $scope.displayUserIsFollowing = function(organization) {
      return (
        organization &&
        $scope.emailNotification &&
        $scope.emailNotification.followingOrganizations &&
        $scope.emailNotification.followingOrganizations.indexOf(organization._id) !== -1
      );
    };

    $scope.getOrganizations = function() {
      $http({
        url: '/api/organizations-catalog',
        params: $scope.query
      })
      .then(function(resp) {
        $scope.orgs = resp.data.orgs;
        $scope.buildPager(resp.data.count);

        // increment resolvedResources
        $scope.resolvedResources++;
      })
      .catch(function(err) {
        console.log('err', err);
      });
    };

    $scope.getUserEmailNotification = function() {
      if (!Authentication.user) {
        $scope.emailNotification = {};
        $scope.resolvedResources++;
        return;
      }

      $http.get('/api/emailnotifications/get-my-notification')
      .then(function(resp) {
        $scope.emailNotification = resp.data ? resp.data : {};
        $scope.resolvedResources++;
      })
      .catch(function(err) {
        console.log('Unable to load user email settings', err);
      });
    };

    $scope.updateFilter = function() {
      var man = '';
      var pow = '';
      var crys = '';
      var color = '';
      var cells = '';
      var locs = '';

      // // find all checked boxes for wattage
      // for (var key in $scope.wattCheckboxes) {
      //   if ($scope.wattCheckboxes[key]) {
      //     pow += $scope.rangesReverse[key] + '|';
      //   }
      // }

      // find all checked manufacturers
      for (var key in $scope.orgCheckboxes) {
        if ($scope.orgCheckboxes[key]) {
          man += key + '|';
        }
      }

      // find all checked crystalline types
      for (key in $scope.crysCheckboxes) {
        if ($scope.crysCheckboxes[key]) {
          crys += key + '|';
        }
      }

      // find all checked frame colors
      for (key in $scope.fColorCheckboxes) {
        if ($scope.fColorCheckboxes[key]) {
          color += key + '|';
        }
      }

      // find all checked number of cells
      for (key in $scope.numCellsCheckboxes) {
        if ($scope.numCellsCheckboxes[key]) {
          cells += key + '|';
        }
      }

      // find all checked manufacturing locations
      for (key in $scope.manufacturingLocationsCheckboxes) {
        if ($scope.manufacturingLocationsCheckboxes[key]) {
          locs += key + '|';
        }
      }

      $scope.query.man = man;
      $scope.query.pow = pow;
      $scope.query.crys = crys;
      $scope.query.color = color;
      $scope.query.cells = cells;
      $scope.query.locs = locs;
      $scope.query.quantity = $scope.quantity;
      $scope.query.isman = $scope.isman;
      $scope.query.isreseller = $scope.isreseller;
      $scope.query.page = 1;
      $state.go('catalog', $scope.query);
    };

    $scope.clearSectionCheckboxes = function(arg) {
      switch(arg) {
        case 'supplierType':
          $scope.isman = undefined;
          $scope.isreseller = undefined;
          break;
        case 'frameColor':
          // clear all checked frame colors
          for (var key in $scope.fColorCheckboxes) {
            $scope.fColorCheckboxes[key] = false;
          }
          break;
        case 'crystallineType':
          // clear all checked crystalline types
          for (key in $scope.crysCheckboxes) {
            $scope.crysCheckboxes[key] = false;
          }
          break;
        case 'numCells':
          // clear all checked cells
          for (key in $scope.numCellsCheckboxes) {
            $scope.numCellsCheckboxes[key] = false;
          }
          break;
        case 'moduleWatt':
          // clear all checked watt check boxes
          for (key in $scope.wattCheckboxes) {
            $scope.wattCheckboxes[key] = false;
          }
          break;
        case 'manufacturingLocations':
          for (key in $scope.manufacturingLocationsCheckboxes) {
            $scope.manufacturingLocationsCheckboxes[key] = false;
          }
          break;
        case 'brand':
          // clear all checked organizations
          for (key in $scope.orgCheckboxes) {
            $scope.orgCheckboxes[key] = false;
          }
          break;
        default:
          return;
      }

      // now update the filter
      $scope.updateFilter();
    };

    $scope.clearAllFilter = function() {
      $state.transitionTo('catalog');
    };


    $scope.toggleFilter = function() {
      $scope.hiddenFilterClass = $scope.hiddenFilterClass ? '' : 'hidden-xs';
    };

    $scope.buildWattCheckboxes = function() {
      $scope.ranges = {
        '100': '0 - 100 Watts',
        '200': '101 - 200 Watts',
        '300': '201 - 300 Watts',
        '400': '301 - 400 Watts',
        '500': '401 - 500 Watts'
      };

      $scope.rangesReverse = {
        '0 - 100 Watts': '100',
        '101 - 200 Watts': '200',
        '201 - 300 Watts': '300',
        '301 - 400 Watts': '400',
        '401 - 500 Watts': '500'
      };

      $scope.wattCheckboxes = {};
      var queryCheckedBoxes = $stateParams.pow ? $stateParams.pow.split('|') : [];
      for (var range in $scope.ranges) {
        $scope.wattCheckboxes[$scope.ranges[range]] = queryCheckedBoxes.indexOf(range) !== -1 ? true : false;
      }
    };

    $scope.buildFilterCheckboxes = function() {
      // get panel model filters
      $http.get('/api/panelmodels-filters')
      .then(function(resp) {
        var filters = resp.data;
        $scope.manufacturers = filters.manufacturers;
        $scope.crystallineTypes = filters.crystallineTypes;
        $scope.frameColors = filters.frameColors;
        $scope.numberOfCells = filters.numberOfCells;
        $scope.manufacturingLocations = filters.manufacturingLocations;

        $scope.orgCheckboxes = {};
        var queryCheckedBoxes = $stateParams.man ? $stateParams.man.split('|') : [];
        $scope.manufacturers.sort(function(a,b) {
          if (a.toLowerCase() < b.toLowerCase()) return -1;
          if (a.toLowerCase() > b.toLowerCase()) return 1;
          return 0;
        });
        $scope.manufacturers.forEach(function(manufacturer) {
          $scope.orgCheckboxes[manufacturer] = queryCheckedBoxes.indexOf(manufacturer) !== -1 ? true : false;
        });

        $scope.crysCheckboxes = {};
        queryCheckedBoxes = $stateParams.crys ? $stateParams.crys.split('|') : [];
        $scope.crystallineTypes.forEach(function(crystallineType) {
          $scope.crysCheckboxes[crystallineType] = queryCheckedBoxes.indexOf(crystallineType) !== -1 ? true : false;
        });

        $scope.fColorCheckboxes = {};
        queryCheckedBoxes = $stateParams.color ? $stateParams.color.split('|') : [];
        $scope.frameColors.forEach(function(frameColor) {
          $scope.fColorCheckboxes[frameColor] = queryCheckedBoxes.indexOf(frameColor) !== -1 ? true : false;
        });

        // build checkboxes for number of cells
        $scope.numCellsCheckboxes = {};
        queryCheckedBoxes = $stateParams.cells ? $stateParams.cells.split('|').filter(function(c) { return c.length && !isNaN(c); }) : [];
        $scope.numberOfCells.sort(function(a,b) { return a-b; });
        $scope.numberOfCells.splice($scope.numberOfCells.indexOf(null), 1); // remove one null item

        // only accept 3 number of cells
        var accepted = [60, 72, 96];
        $scope.numberOfCells = $scope.numberOfCells.filter(function(numCells) { return accepted.indexOf(numCells) !== -1; });

        $scope.numberOfCells.forEach(function(numCells) {
          if (!numCells) return;
          $scope.numCellsCheckboxes[numCells] = queryCheckedBoxes.indexOf(numCells.toString()) !== -1 ? true : false;
        });

        // add checkbox values for is man or reseller
        $scope.isman = $stateParams.isman === 'true' ? true : false;
        $scope.isreseller = $stateParams.isreseller === 'true' ? true : false;

        // add manufacturing location crysCheckboxes
        $scope.manufacturingLocationsCheckboxes = {};
        queryCheckedBoxes = $stateParams.locs ? $stateParams.locs.split('|') : [];
        $scope.manufacturingLocations = $scope.manufacturingLocations.filter(function(l) { return l.length; });
        $scope.manufacturingLocations.sort(function(a,b) {
          if (a.toLowerCase() < b.toLowerCase()) return -1;
          if (a.toLowerCase() > b.toLowerCase()) return 1;
          return 0;
        });

        $scope.manufacturingLocations.forEach(function(manufacturingLocation) {
          if (!manufacturingLocation) return;
          $scope.manufacturingLocationsCheckboxes[manufacturingLocation] = queryCheckedBoxes.indexOf(manufacturingLocation) !== -1 ? true : false;
        });

        // increment resolved resources
        $scope.resolvedResources++;
      });

      // get pricereview filters
      $http.get('/api/pricereviews-filters')
      .then(function(resp) {
        var filters = resp.data;
        $scope.quantities = filters.quantities.sort(function(a,b) {
          if (a.toLowerCase() < b.toLowerCase()) return -1;
          if (a.toLowerCase() > b.toLowerCase()) return 1;
          return 0;
        });

        $scope.resolvedResources++;
      });
    };

    $scope.buildPager = function (count) {
      $scope.itemsPerPage = 15;
      $scope.totalCount = count;
      $scope.currentPage = $stateParams.page;
    };

    $scope.pageChanged = function () {
      $scope.query.page = $scope.currentPage;
      $state.go('catalog', $scope.query);
    };

    $scope.sortBy = function() {
      $scope.query.price = $stateParams.price ? '' : true;
      $state.go('catalog', $scope.query);
    };

    $scope.searchSubmit = function() {
      $scope.query.q = $scope.search;
      $scope.query.page = 1;
      $state.go('catalog', $scope.query);
    };

    $scope.routeToOrg = function (organization) {
      $state.go('organizations.view', { name: organization.urlName });
    };

    $scope.contactSupplier = function(ev, organization) {
      if (!$scope.authentication.user) {
        return $state.go('authentication.signin');
      }
      var modalInstance = $modal.open({
        templateUrl: '/modules/organizations/client/views/contact-supplier.client.view.html',
        controller: 'ContactSupplierController',
        resolve: {
          modalOrganization: function() {
            return organization;
          }
        },
        windowClass: 'app-modal-window'
      });

      modalInstance.result.then(function() {
        if (organization) {
          Notification.primary('A contact request has been sent to ' + organization.companyName + '.');
        }
      });
    };

    $scope.followOrganization = function(ev, organization) {
      if (!Authentication.user) {
        return $state.go('authentication.signin');
      }

      $http.get('/api/emailnotifications-follow/' + organization._id)
      .then(function(response) {
        $scope.emailNotification = response.data.newEmailNotification;
        var isFollowing = response.data.isFollowing;

        var notificationString = isFollowing ? 'Following' : 'Unfollowed';
        var description = isFollowing ?
          '. Updates about this company will appear in your weekly/monthly emails.'
          :
          '';
        Notification.primary(notificationString + ' ' + organization.companyName + description);
        $analytics.eventTrack('User ' + Authentication.user.displayName + ' ' + (isFollowing ? 'Following' : 'Unfollowed') + ' ' + organization.companyName);
      })
      .catch(function(err) {
        console.log('unable to follow organization', err);
        Notification.error('Error updating supplier following settings');
      });
    };

    // load resources from server after inititalizing all controller functions

    // fetch results based on query
    $scope.getOrganizations();
    $scope.getUserEmailNotification();

    // initialize filter boxes
    $scope.buildWattCheckboxes();
    $scope.buildFilterCheckboxes();
  }
]);
