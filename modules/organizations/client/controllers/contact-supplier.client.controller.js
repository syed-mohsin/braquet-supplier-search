'use strict';

// Reviews controller
angular.module('organizations').controller('ContactSupplierController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'Organizations', 'modalOrganizationId',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, Organizations, modalOrganizationId) {
    $scope.authentication = Authentication;

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

      $http.post('/api/organizations/'+ modalOrganizationId + '/contact', contactOrganization)
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
