'use strict';

// Configuring the projects module
angular.module('projects').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Projects',
      state: 'projects',
      type: 'dropdown',
      roles: ['user', 'seller']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'projects', {
      title: 'List projects',
      state: 'projects.list',
      roles: ['user', 'seller']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'projects', {
      title: 'Create projects',
      state: 'projects.create',
      roles: ['user']
    });
  }
]);
