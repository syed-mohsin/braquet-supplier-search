'use strict';

// Reviews controller
angular.module('organizations').controller('ContactSupplierController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'Organizations', 'modalOrganization',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, Organizations, modalOrganization) {
    $scope.authentication = Authentication;
    $scope.organization = modalOrganization;

    $scope.projectRoles = ['Contractor', 'EPC', 'Developer', 'Other'];
    $scope.quantities = ['0kW-100kW', '101kW-500kW', '501kW-1MW', '>1MW'];
    $scope.presentDate = new Date();
    $scope.shippingAddress = {};

    // Contact a supplier
    $scope.contact = function(isValid) {
      $scope.error = null;

      if(!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'contactSupplierForm');

        return false;
      }

      var contactOrganization = {
        content: this.content,
        projectRole: this.projectRole,
        preferredModuleWattage: this.preferredModuleWattage,
        quantity: this.quantity,
        deliveryDate: this.deliveryDate,
        shippingAddress: this.shippingAddress
      };

      $http.post('/api/organizations/'+ modalOrganization._id + '/contact', contactOrganization)
        .success(function(response) {
          $modalInstance.close();
        })
        .error(function(errorResponse) {
          if(errorResponse && errorResponse.message) {
            $scope.error = errorResponse.message;
          } else {
            $scope.error = 'Something went wrong...';
          }
        });
    };
  }
]);
