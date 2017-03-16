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
      .state('organizations.view-public', {
        url: '/:organizationId/public',
        templateUrl: 'modules/organizations/client/views/view-public-organization.client.view.html',
        controller: 'PublicViewOrganizationController',
        resolve: {
          publicOrgService: function($stateParams, $http) {
            return $http.get('/api/organizations/' + $stateParams.organizationId + '/public');
          }
        }
      })
      .state('organizations.view', {
        url: '/:organizationId',
        templateUrl: 'modules/organizations/client/views/view-organization.client.view.html',
        controller:'ViewOrganizationController',
        data: {
          roles: ['user', 'seller', 'admin']
        },
        resolve: {
          orgService: function($stateParams, Organizations) {
            return Organizations.get({
              organizationId: $stateParams.organizationId
            });
          }
        }
      })
      .state('organizations.edit', {
        url: '/:organizationId/edit',
        templateUrl: 'modules/organizations/client/views/edit-organization.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);
