'use strict';

// Setting up route
angular.module('organizations').config(['$stateProvider',
  function ($stateProvider) {
    // organizations general state routing
    $stateProvider
      .state('organizations', {
        abstract: true,
        url: '/organizations',
        template: '<ui-view/>'
      })
      .state('organizations.create', {
        url: '/create',
        templateUrl: 'modules/organizations/client/views/create-organization.client.view.html',
        data: {
          roles: ['admin'],
          pageTitle: 'New Organization - Braquet'
        }
      })
      .state('organizations.view-public', {
        url: '/:name?view&page&sortType&{ascending:bool}&manufacturer&panelType&quantity',
        templateUrl: 'modules/organizations/client/views/view-public-organization.client.view.html',
      })
      .state('organizations.view', {
        url: '/:name?view&page&sortType&{ascending:bool}&manufacturer&panelType$quantity',
        templateUrl: 'modules/organizations/client/views/view-organization.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      })
      .state('organizations.edit', {
        url: '/:organizationId/edit',
        templateUrl: 'modules/organizations/client/views/edit-organization.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin'],
          pageTitle: 'Edit Organization'
        }
      });
  }
]);
