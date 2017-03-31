'use strict';

// Price Reviews service used for communicating with the price reviews REST endpoints
angular.module('reviews').factory('Reviews', ['$resource',
  function ($resource) {
    return $resource('api/pricereviews/:priceReviewId', {
      reviewId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
