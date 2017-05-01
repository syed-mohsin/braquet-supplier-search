'use strict';

//EmailNotifications service used for communicating with the emailNotifications REST endpoints
angular.module('emailNotifications').factory('EmailNotifications', ['$resource',
  function ($resource) {
    return $resource('api/emailNotifications/:emailNotificationId', {
      emailNotificationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
