'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
    .state('home', {
      url: '/',
      controller: function($state, Authentication) {
        if (Authentication.user) {
          $state.go('dashboard');
        } else {
          $state.go('welcome');
        }
      }
    })
    // home page for users
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'modules/projects/client/views/list-projects.client.view.html'
    })
    .state('welcome', {
      url: '/welcome',
      templateUrl: 'modules/core/client/views/welcome.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('invite', {
      url: '/welcome/invite',
      templateUrl: 'modules/core/client/views/invite.client.view.html'
    })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    });
  }
]);
