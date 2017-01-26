'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('connections').factory('Connections', ['$resource',
  function ($resource) {
    return $resource('api/connections/:connectionId', {
      connectionId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);