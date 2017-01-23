'use strict';

// Setting up route
angular.module('connections').config(['$stateProvider',
  function ($stateProvider) {
    // connections state routing
    $stateProvider
      .state('connections', {
        abstract: true,
        url: '/connections',
        template: '<ui-view/>'
      })
      .state('connections.list', {
        url: '',
        templateUrl: 'modules/connections/client/views/list-connections.client.view.html',
        data: {
          roles: ['user', 'seller']
        }
      })
      .state('connections.create', {
        url: '/create',
        templateUrl: 'modules/connections/client/views/create-connection.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('connections.view', {
        url: '/:connectionId',
        templateUrl: 'modules/connections/client/views/view-connection.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);
