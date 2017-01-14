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
        templateUrl: 'modules/connections/client/views/create-project.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('connections.view', {
        url: '/:projectId',
        templateUrl: 'modules/connections/client/views/view-project.client.view.html'
      })
      .state('connections.edit', {
        url: '/:projectId/edit',
        templateUrl: 'modules/connections/client/views/edit-project.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
