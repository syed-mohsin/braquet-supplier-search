'use strict';

// Setting up route
angular.module('organizations').config(['$stateProvider',
  function ($stateProvider) {
    // organizations state routing
    $stateProvider
      .state('organizations', {
        abstract: true,
        url: '/organizations',
        template: '<ui-view/>'
      })
      .state('organizations.list', {
        url: '',
        templateUrl: 'modules/organizations/client/views/list-organizations.client.view.html',
        data: {
          roles: ['user', 'seller']
        }
      })
      .state('organizations.create', {
        url: '/create',
        templateUrl: 'modules/organizations/client/views/create-organization.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('organizations.view', {
        url: '/:organizationId',
        templateUrl: 'modules/organizations/client/views/view-organization.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);
