'use strict';

// Configuring the organizations module
angular.module('organizations').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Company Directory',
      state: 'organizations.list',
      roles: ['user', 'seller', 'admin']
    });
  }
]);
