'use strict';

// Setting up route
angular.module('emailNotifications').config(['$stateProvider',
  function ($stateProvider) {
    // EmailNotifications state routing
    $stateProvider
      .state('emailNotifications', {
        abstract: true,
        url: '/emailnotifications',
        template: '<ui-view/>'
      })
      .state('emailNotifications.view', {
        url: '/:emailNotificationId',
        templateUrl: 'modules/emailnotifications/client/views/view-emailnotification.client.view.html'
      })
      .state('emailNotifications.edit', {
        url: '/:emailNotificationId/edit',
        templateUrl: 'modules/emailnotifications/client/views/edit-emailnotification.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
