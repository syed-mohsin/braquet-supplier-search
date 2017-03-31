'use strict';

// Configuring the Reviews module
angular.module('reviews').run(['Menus',
  function (Menus) {
    // Add the reviews dropdown item
    Menus.addMenuItem('topbar', {
      title: 'My Reviews',
      state: 'reviews',
      type: 'dropdown',
      roles: ['user', 'seller', 'admin']
    });

    // Add the reviews dropdown item
    Menus.addSubMenuItem('topbar', 'reviews', {
      title: 'Written Reviews',
      state: 'reviews.list',
      roles: ['user', 'seller', 'admin']
    });

    // Add the reviews dropdown item
    Menus.addSubMenuItem('topbar', 'reviews', {
      title: 'Price Reviews',
      state: 'pricereviews.list',
      roles: ['user', 'seller', 'admin']
    });
  }
]);
