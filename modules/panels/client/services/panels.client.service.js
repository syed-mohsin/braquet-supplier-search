'use strict';

//Panels service used for communicating with the panels REST endpoints
angular.module('panels').factory('PanelModels', ['$resource',
  function ($resource) {
    return $resource('api/panelmodels/:panelId', {
      panelId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
