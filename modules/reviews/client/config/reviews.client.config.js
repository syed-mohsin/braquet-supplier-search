'use strict';

// Configuring the Reviews module
angular.module('reviews').run(['Menus',
  function (Menus) {
    // Add the reviews dropdown item
    Menus.addMenuItem('topbar', {
      title: 'My Reviews',
      state: 'reviews.list',
      roles: ['user', 'seller', 'admin']
    });
  }
]);
