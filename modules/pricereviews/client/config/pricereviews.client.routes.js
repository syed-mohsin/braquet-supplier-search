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
        templateUrl: 'modules/pricereviews/client/views/list-pricereviews.client.view.html'
      })
      .state('pricereviews.admin-list', {
        url: '/admin-reviews',
        templateUrl: 'modules/pricereviews/client/views/admin-list-pricereviews.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('pricereviews.view', {
        url: '/:priceReviewId',
        templateUrl: 'modules/pricereviews/client/views/view-pricereview.client.view.html'
      })
      .state('pricereviews.edit', {
        url: '/:priceReviewId/edit',
        templateUrl: 'modules/pricereviews/client/views/edit-pricereview.client.view.html',
        data: {
          roles: ['admin']
        }
      });
  }
]);
