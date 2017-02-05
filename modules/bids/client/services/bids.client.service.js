'use strict';

// Bids service used for communicating with the bids REST endpoints
angular.module('bids').factory('Bids', ['$resource',
  function ($resource) {
    return $resource('api/bids/:bidId', {
      bidId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
  	});
  }
]);