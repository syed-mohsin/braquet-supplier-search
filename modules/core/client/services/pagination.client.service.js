'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('Pagination', [
  function () {
    // build pager system
    this.buildPage = function(itemsArray, currentPage, itemsPerPage) {
      // scroll to top of the page
      document.body.scrollTop = document.documentElement.scrollTop = 0;

      var begin = (((currentPage || 1) - 1) * (itemsPerPage || 15));
      var end = begin + (itemsPerPage || 15);

      return {
        items: itemsArray.slice(begin, end),
        currentPage: currentPage || 1,
        itemsPerPage: itemsPerPage || 15,
        totalCount: itemsArray.length
      };
    };
  }
]);
