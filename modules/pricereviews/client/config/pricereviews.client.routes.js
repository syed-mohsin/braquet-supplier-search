'use strict';

// Setting up route
angular.module('pricereviews').config(['$stateProvider',
  function ($stateProvider) {
    // Reviews state routing
    $stateProvider
      .state('pricereviews', {
        abstract: true,
        url: '/pricereviews',
        template: '<ui-view/>'
      })
      .state('pricereviews.list', {
        url: '',
        templateUrl: 'modules/reviews/client/views/list-pricereviews.client.view.html'
      })
      .state('pricereviews.admin-list', {
        url: '/admin-reviews',
        templateUrl: 'modules/reviews/client/views/admin-list-pricereviews.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('pricereviews.view', {
        url: '/:priceReviewId',
        templateUrl: 'modules/reviews/client/views/view-pricereview.client.view.html'
      })
      .state('pricereviews.edit', {
        url: '/:priceReviewId/edit',
        templateUrl: 'modules/reviews/client/views/edit-pricereview.client.view.html',
        data: {
          roles: ['admin']
        }
      });
  }
]);
