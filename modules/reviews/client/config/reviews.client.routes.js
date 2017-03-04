'use strict';

// Setting up route
angular.module('reviews').config(['$stateProvider',
  function ($stateProvider) {
    // Reviews state routing
    $stateProvider
      .state('reviews', {
        abstract: true,
        url: '/reviews',
        template: '<ui-view/>'
      })
      .state('reviews.list', {
        url: '',
        templateUrl: 'modules/reviews/client/views/list-reviews.client.view.html'
      })
      .state('reviews.create', {
        url: '/create',
        templateUrl: 'modules/reviews/client/views/create-review.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      })
      .state('reviews.view', {
        url: '/:reviewId',
        templateUrl: 'modules/reviews/client/views/view-review.client.view.html'
      })
      .state('reviews.edit', {
        url: '/:reviewId/edit',
        templateUrl: 'modules/reviews/client/views/edit-review.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);
