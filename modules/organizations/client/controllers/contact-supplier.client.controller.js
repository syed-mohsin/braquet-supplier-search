'use strict';

// Reviews controller
angular.module('organizations').controller('ContactSupplierController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'Organizations', 'modalOrganizationId',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, Organizations, modalOrganizationId) {
    $scope.authentication = Authentication;
    $scope.anonymous = true; // all created reviews should be anonymous by default

    // Contact a supplier
    $scope.contact = function(isValid) {
      $scope.error = null;

      if(!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'contactSupplierForm');

        return false;
      }

      var inquiry = {
        'content': this.content
      };
      
      $http.post('/api/organizations/'+ modalOrganizationId + '/contact', inquiry)
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
