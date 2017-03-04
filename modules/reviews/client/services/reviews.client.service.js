'use strict';

//Reviews service used for communicating with the reviews REST endpoints
angular.module('reviews').factory('Reviews', ['$resource',
  function ($resource) {
    return $resource('api/reviews/:reviewId', {
      reviewId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
