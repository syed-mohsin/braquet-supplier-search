'use strict';

// Setting up route
angular.module('panels').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('panels', {
        abstract: true,
        url: '/panels',
        template: '<ui-view/>'
      })
      .state('panels.list', {
        url: '',
        templateUrl: 'modules/panels/client/views/list-panels.client.view.html',
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
