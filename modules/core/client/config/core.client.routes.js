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
        var user = Authentication.user;
        if (user) {
          if (user.roles[0] === 'tempUser' || user.roles[0] === 'tempSeller') {
            $state.go('awaiting-confirmation', {}, { location: false });
          } else if (user.roles.indexOf('seller') !== -1) {
            $state.go('organizations.view', { organizationId: user.organization }, { location: false });
          } else if (user.roles.indexOf('user') !== -1) {
            $state.go('catalog', {}, { location: false });
          }
        } else {
          $state.go('search', {}, { location: false });
        }
      }
    })
    // home page for users
    // .state('dashboard', {
    //   url: '/dashboard'
    // })
    .state('search', {
      url: '/search',
      templateUrl: 'modules/core/client/views/search.client.view.html'
    })
    .state('catalog', {
      url: '/catalog?q&man&pow&crys?color?cells?page',
      templateUrl: 'modules/core/client/views/catalog.client.view.html'
    })
    // .state('welcome', {
    //   url: '/welcome',
    //   templateUrl: 'modules/core/client/views/welcome.client.view.html',
    //   data: {
    //     ignoreState: true
    //   }
    // })
    // .state('awaiting-confirmation', {
    //   url: '/awaiting-confirmation',
    //   templateUrl: 'modules/core/client/views/awaiting-confirmation.client.view.html',
    //   controller: function($state, Authentication) {
    //     var user = Authentication.user;
    //     if (user.verified && user.emailVerified) {
    //       $state.go('home');
    //     }
    //   }
    // })
    .state('team', {
      url: '/team',
      templateUrl: 'modules/core/client/views/team.client.view.html'
    })
    .state('contact', {
      url: '/contact',
      templateUrl: 'modules/core/client/views/contact.client.view.html'
    })
    .state('privacy-policy', {
      url: '/privacy-policy',
      templateUrl: 'modules/core/client/views/privacy-policy.client.view.html'
    })
    // .state('invite', {
    //   url: '/welcome/invite',
    //   templateUrl: 'modules/core/client/views/invite.client.view.html'
    // })
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
