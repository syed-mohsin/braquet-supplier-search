'use strict';

// Configuring the projects module
angular.module('bids').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Bids',
      state: 'bids',
      type: 'dropdown',
      roles: ['seller']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'bids', {
      title: 'My Bids',
      state: 'bids.list',
      roles: ['seller']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'bids', {
      title: 'Place Bids',
      state: 'projects.list',
      roles: ['seller']
    });
  }
]);