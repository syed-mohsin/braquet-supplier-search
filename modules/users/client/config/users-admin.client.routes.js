'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.organizations', {
        url: '/organizations/',
        templateUrl: 'modules/organizations/client/views/admin-list-organizations.client.view.html',
        controller: 'AdminOrganizationsController',
        data: {
          roles: ['admin']
        }
      })
      .state('panels', {
        abstract: true,
        url: '/panels',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      })
      .state('panels.list', {
        url: '/panels-list',
        templateUrl: 'modules/panels/client/views/list-panels.client.view.html',
        controller: 'PanelController',
        data: {
          roles: ['admin']
        }
      })
      .state('panels.view', {
        url: '/:panelId',
        templateUrl: 'modules/panels/client/views/view-panel.client.view.html',
        controller: 'PanelController',
        data: {
          roles: ['admin']
        }
      });
  }
]);
