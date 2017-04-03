'use strict';

// Configuring the Articles module
angular.module('users.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Users',
      state: 'admin.users',
      roles: ['admin']
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'View Panel Models',
      state: 'panels.list',
      roles: ['admin']
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Organizations',
      state: 'admin.organizations',
      roles: ['admin']
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Add Organization',
      state: 'organizations.create',
      roles: ['admin']
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Reviews',
      state: 'reviews.admin-list',
      roles: ['admin']
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Price Reviews',
      state: 'pricereviews.admin-list',
      roles: ['admin']
    });
  }
]);
