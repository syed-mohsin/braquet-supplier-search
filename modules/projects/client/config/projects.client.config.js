'use strict';

// Configuring the projects module
angular.module('projects').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Request for Quotes',
      state: 'projects',
      type: 'dropdown',
      roles: ['user', 'seller']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'projects', {
      title: 'See RFQs',
      state: 'projects.list',
      roles: ['user', 'seller']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'projects', {
      title: 'Submit a RFQ',
      state: 'projects.create',
      roles: ['user']
    });
  }
]);
