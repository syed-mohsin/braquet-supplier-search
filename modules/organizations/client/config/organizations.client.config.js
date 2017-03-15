'use strict';

// Configuring the organizations module
angular.module('organizations').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Company Directory',
      state: 'organizations',
      type: 'dropdown',
      roles: ['user', 'seller']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'organizations', {
      title: 'Company Directory',
      state: 'organizations.list',
      roles: ['user', 'seller']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'organizations', {
      title: 'Add Organizations',
      state: 'organizations.create',
      roles: ['admin']
    });
  }
]);