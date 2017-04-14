'use strict';

// Price Reviews service used for communicating with the price reviews REST endpoints
angular.module('pricereviews').factory('PriceReviews', ['$resource',
  function ($resource) {
    return $resource('api/pricereviews/:priceReviewId', {
      priceReviewId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
