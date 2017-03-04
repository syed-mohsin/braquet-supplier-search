'use strict';

// Configuring the Reviews module
angular.module('reviews').run(['Menus',
  function (Menus) {
    // Add the reviews dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Reviews',
      state: 'reviews',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'reviews', {
      title: 'List Reviews',
      state: 'reviews.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'reviews', {
      title: 'Create Reviews',
      state: 'reviews.create',
      roles: ['user', 'seller', 'admin']
    });
  }
]);
