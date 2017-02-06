'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('organizations').factory('Organizations', ['$resource',
  function ($resource) {
    return $resource('api/organizations/:organizationId', {
      organizationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);