'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.path();
      var hasTrailingSlash = path.length > 1 && path[path.length - 1] === '/';

      if (hasTrailingSlash) {
        // if last character is a slash, return the same url without the slash
        var newPath = path.substr(0, path.length - 1);
        $location.replace().path(newPath);
      }
    });

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
      data: {
        pageTitle: 'Braquet',
        pageDescription: 'Search for qualified solar hardware suppliers'
      },
      controller: function($state, Authentication) {
        var user = Authentication.user;
        if (user) {
          if (user.roles[0] === 'tempUser' || user.roles[0] === 'tempSeller') {
            $state.go('awaiting-confirmation', {}, { location: false });
          } else {
            $state.go('catalog', {}, { location: 'replace' });
          }
        } else {
          $state.go('search', {}, { location: false });
        }
      }
    })
    .state('search', {
      url: '/search',
      templateUrl: 'modules/core/client/views/search.client.view.html'
    })
    .state('catalog', {
      url: '/catalog?q&quantity&man&pow&crys&color&cells&page&price&isman&isreseller',
      templateUrl: 'modules/core/client/views/catalog.client.view.html',
      data: {
        pageTitle: 'Search For Module Suppliers'
      }
    })
    .state('team', {
      url: '/team',
      templateUrl: 'modules/core/client/views/team.client.view.html',
      data: {
        pageTitle: 'Team - Braquet'
      }
    })
    .state('contact', {
      url: '/contact',
      templateUrl: 'modules/core/client/views/contact.client.view.html',
      data: {
        pageTitle: 'Contact Us - Braquet'
      }
    })
    .state('privacy-policy', {
      url: '/privacy-policy',
      templateUrl: 'modules/core/client/views/privacy-policy.client.view.html',
      data: {
        pageTitle: 'Privacy Policy - Braquet'
      }
    })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true,
        pageTitle: 'Braquet - Page Not Found (404)'
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true,
        pageTitle: 'Braquet - Bad Request'
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true,
        pageTitle: 'Forbidden (403)'
      }
    });
  }
]);
