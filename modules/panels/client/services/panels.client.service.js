'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('panels').factory('PanelModels', ['$resource',
  function ($resource) {
    return $resource('api/panelmodels/:panelId', {
      organizationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);