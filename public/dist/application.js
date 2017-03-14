'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function () {
  // Init module configuration options
  var applicationModuleName = 'mean';
  var applicationModuleVendorDependencies = ['ngResource', 'ngAnimate', 'ngMaterial', 'ngMessages', 'ui.router', 'ui.bootstrap', 'ui.utils', 'angularFileUpload'];

  // Add a new vertical module
  var registerModule = function (moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule
  };
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider', '$httpProvider',
  function ($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    $httpProvider.interceptors.push('authInterceptor');
  }
]);

angular.module(ApplicationConfiguration.applicationModuleName).run(["$rootScope", "$state", "Authentication", function ($rootScope, $state, Authentication) {

  // Check authentication before changing state
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.roles && toState.data.roles.length > 0) {
      var allowed = false;
      toState.data.roles.forEach(function (role) {
        if (Authentication.user.roles !== undefined && Authentication.user.roles.indexOf(role) !== -1) {
          allowed = true;
          return true;
        }
      });

      if (!allowed) {
        event.preventDefault();
        if (Authentication.user !== undefined && typeof Authentication.user === 'object') {
          $state.go('forbidden');
        } else {
          $state.go('authentication.signin').then(function () {
            storePreviousState(toState, toParams);
          });
        }
      }
    }
  });

  // Record previous state
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    storePreviousState(fromState, fromParams);
  });

  // Store previous state
  function storePreviousState(state, params) {
    // only store this state if it shouldn't be ignored 
    if (!state.data || !state.data.ignoreState) {
      $state.previous = {
        state: state,
        params: params,
        href: $state.href(state, params)
      };
    }
  }
}]);

//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash && window.location.hash === '#_=_') {
    if (window.history && history.pushState) {
      window.history.pushState('', document.title, window.location.pathname);
    } else {
      // Prevent scrolling by storing the page's current scroll offset
      var scroll = {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      };
      window.location.hash = '';
      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scroll.top;
      document.body.scrollLeft = scroll.left;
    }
  }

  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('bids');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('chat');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('connections');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
ApplicationConfiguration.registerModule('core.admin', ['core']);
ApplicationConfiguration.registerModule('core.admin.routes', ['ui.router']);

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('organizations');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('panels');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('projects');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('reviews');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users', ['core']);
ApplicationConfiguration.registerModule('users.admin', ['core.admin']);
ApplicationConfiguration.registerModule('users.admin.routes', ['core.admin.routes']);

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
'use strict';

// Setting up route
angular.module('bids').config(['$stateProvider',
  function ($stateProvider) {
    // projects state routing
    $stateProvider
      .state('bids', {
        abstract: true,
        url: '/bids',
        template: '<ui-view/>'
      })
      .state('bids.list', {
        url: '',
        templateUrl: 'modules/bids/client/views/list-bids.client.view.html',
        data: {
          roles: ['seller']
        }
      })
      // .state('bids.create', {
      //   url: '/:projectId/create',
      //   templateUrl: 'modules/bids/client/views/create-bid.client.view.html',
      //   data: {
      //     roles: ['seller']
      //   }
      // })
      .state('bids.view', {
        url: '/:bidId',
        templateUrl: 'modules/bids/client/views/view-bid.client.view.html',
        data: {
          roles: ['user', 'seller']
        }
      });
  }
]);

'use strict';

// Bids controller
angular.module('bids').controller('BidsController', ['$scope', '$stateParams', '$resource', '$location', '$interval', '$filter', 'Authentication', 'Socket', 'Projects', 'Bids',
  function ($scope, $stateParams, $resource, $location, $interval, $filter, Authentication, Socket, Projects, Bids) {
    $scope.authentication = Authentication;
    $scope.bids = Bids.query();

    // Connect socket
    if (!Socket.socket) {
      Socket.connect();
      console.log('connected to server');
    }

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('chatMessage');
    });

    Socket.on('refreshBidList', function(msg) {
      if (Authentication.user.roles[0] === 'seller' &&
            $location.url() === '/bids') {
        $scope.findMyBids();
      }
    });

    // Remove existing Bid
    $scope.remove = function (bid) {
      if (bid) {
        bid.$remove();

        for (var i in $scope.bids) {
          if ($scope.bids[i] === bid) {
            $scope.Bids.splice(i, 1);
          }
        }
      } else {
        $scope.bid.$remove(function () {
          $location.path('bids');
        });
      }
    };

    // Find a list of ALL Bids
    $scope.find = function () {
      $scope.bids = Bids.query();
    };

    // Find a list of MY Bids
    $scope.findMyBids = function () {
      $scope.bids = Bids.query({}, function(bids) {

        // delete bids that don't have the same user id as current user
        for (var i=$scope.bids.length-1; i>=0;i--)
          if ($scope.bids[i].user._id !== Authentication.user._id)
            $scope.bids.splice(i,1);
      });
    };

    // Find existing Bid and it's associated project
    $scope.findOne = function () {
      $scope.bid = Bids.get({ bidId: $stateParams.bidId },
        function(bid) {

        }, function(error) {
          $location.path('/forbidden');
        });
    };

    // Find existing Project
    $scope.findProject = function () {
      var id = $stateParams.projectId;
      $scope.project = Projects.get({
        projectId: id
      });
    };

    $scope.createDate = function() {
      $scope.date = {
        value: new Date(),
        currentDate: new Date(),
        threeYearAheadDate: new Date().setFullYear(new Date().getFullYear() + 3)
      };
    };

    $scope.getMatches = function (text) {
      var filteredItems = $filter('filter')($scope.project.panel_models, {
        $: text
      });

      return filteredItems;
    };
  }
]);

'use strict';

// Bids controller
angular.module('bids').controller('CreateBidController', ['$scope', '$stateParams', '$resource', '$location', '$interval', '$filter', '$modalInstance', 'Authentication', 'Socket', 'Projects', 'Bids', 'modalProjectId',
  function ($scope, $stateParams, $resource, $location, $interval, $filter, $modalInstance, Authentication, Socket, Projects, Bids, modalProjectId) {
    $scope.authentication = Authentication;
    $scope.panel_models = [];

    // Create new bid
    $scope.create = function (isValid) {
      $scope.error = null;

      // Check that bid deadline has not passed
      if (new Date() > new Date($scope.project.bid_deadline)) {
        $scope.error = 'Bid Deadline has passed';

        return false;
      }

      // check panel_models length
      if (!this.panel_models.length) {
        $scope.error = 'Please select at least one panel model';

        return false;
      }

      // Check for form submission errors
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'bidForm');

        return false;
      }

      // Create new Bid object
      var bid = new Bids({
        fob_shipping: this.fob_shipping,
        delivery_date: this.date.value,
        quantity: this.quantity,
        panel_models: this.panel_models,
        subtotal: this.subtotal * 100, // must be an integer when inputting to mongoose currency model
        shipping_cost: this.shipping_cost * 100,
        sales_tax: this.sales_tax * 100,
        payment_term: this.payment_term,
        project: $scope.project._id,
        project_title: $scope.project.note
      });

      // Redirect after save
      bid.$save(function (response) {

        // close modal
        $modalInstance.close();

        // redirect to view bid
        // $location.path('bids/' + response._id);

        // Clear form fields
        $scope.fob_shipping = '';
        $scope.delivery_date = '';
        $scope.subtotal = '';
        $scope.sales_tax = '';
        $scope.quantity = '';
        $scope.panel_models = null;
        $scope.shipping_cost = '';
        $scope.payment_term = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find existing Bid and it's associated project
    $scope.findOne = function () {
      $scope.bid = Bids.get({ bidId: $stateParams.bidId },
        function(bid) {

        }, function(error) {
          $location.path('/forbidden');
        });
    };

    // Find existing Project
    $scope.findProject = function () {
      var id = modalProjectId || $stateParams.projectId;
      $scope.project = Projects.get({
        projectId: id
      });
    };

    $scope.createDate = function() {
      $scope.date = {
        value: new Date(),
        currentDate: new Date(),
        threeYearAheadDate: new Date().setFullYear(new Date().getFullYear() + 3)
      };
    };

    $scope.getMatches = function (text) {
      var filteredItems = $filter('filter')($scope.project.panel_models, {
        $: text
      });

      return filteredItems;
    };
  }
]);

'use strict';

// Bids service used for communicating with the bids REST endpoints
angular.module('bids').factory('Bids', ['$resource',
  function ($resource) {
    return $resource('api/bids/:bidId', {
      bidId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Configuring the Chat module
angular.module('chat').run(['Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Chat',
      state: 'chat',
      roles: ['user', 'seller', 'admin']
    });
  }
]);

'use strict';

// Configure the 'chat' module routes
angular.module('chat').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('chat', {
        url: '/chat',
        templateUrl: 'modules/chat/client/views/chat.client.view.html',
        data: {
          roles: ['user', 'admin', 'seller']
        }
      });
  }
]);

'use strict';

// Create the 'chat' controller
angular.module('chat').controller('ChatController', ['$scope', '$http', '$location', '$modal', 'Authentication', 'Socket',
  function ($scope, $http, $location, $modal, Authentication, Socket) {
    $scope.chats = [];
    $scope.chat = undefined;

    $http.get('/api/connections')
      .success(function(connections) {
        $scope.connections = connections;
      });

    $http.get('/api/chats')
      .success(function(chats) {
        $scope.chats = chats;
        $scope.chats.map(function(chat) {
          chat.recipient = chat.members.filter(function(member) {
            if (member._id !== Authentication.user._id) {
              return member;
            }
          })[0];

          return chat;
        });
      });

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Event listener for a new chat event
    Socket.on('newChat', function(chat) {
      chat.members.forEach(function(member) {
        if (member._id !== Authentication.user._id) {
          chat.recipient = member;
        }
      });

      $scope.chats.push(chat);
    });

    // Add an event listener to the 'chatMessage' event
    Socket.on('chatMessage', function (data) {
      var chatId = data.chatId;
      var message = data.message;
      $scope.chats.forEach(function(chat, i) {
        if (chat._id === chatId) {
          $scope.chats[i].messages.push(message);
        }
      });
    });

    // Create a controller method for sending messages
    $scope.sendMessage = function () {
      if (!$scope.chat) {
        return false;
      }

      // Create a new message object
      var message = {
        content: this.messageText,
      };

      var data = {
        chatId: $scope.chat._id,
        members: $scope.chat.members,
        message: message
      };

      // Emit a 'chatMessage' message event
      Socket.emit('chatMessage', data);

      // Clear the message text
      this.messageText = '';
    };

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('chatMessage');
    });

    // select chat
    $scope.selectChat = function(chat) {
      $scope.chat = chat;
      $scope.chat.members.forEach(function(member) {
        if (member._id !== Authentication.user._id) {
          $scope.chat.recipient = member;
        }
      });
    };

    // popup dialog that allows users to begin more chats with connections
    $scope.showAddChats = function(ev) {
      console.log(ev);

      var modalInstance = $modal.open({
        templateUrl: '/modules/chat/client/views/add-chats.client.view.html',
        windowClass: 'app-modal-window',
        scope: $scope,
        controller: ["$scope", "$http", "$filter", "$modalInstance", function($scope, $http, $filter, $modalInstance) {
          $scope.selectedChatter = undefined;

          console.log('connections', $scope.connections);

          $scope.buildPager = function () {
            $scope.pagedItems = [];
            $scope.itemsPerPage = 15;
            $scope.currentPage = 1;
            $scope.figureOutItemsToDisplay();
          };

          $scope.figureOutItemsToDisplay = function () {
            if ($scope.selectedChatter) {
              $scope.filteredItems = [];
            } else {
              $scope.filteredItems = $filter('filter')($scope.connections, {
                $: $scope.search
              });
            }

            $scope.filterLength = $scope.filteredItems.length;
            var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
            var end = begin + $scope.itemsPerPage;
            $scope.pagedItems = $scope.filteredItems.slice(begin, end);
          };

          $scope.pageChanged = function () {
            $scope.figureOutItemsToDisplay();
          };

          // for pagination
          $scope.buildPager();

          $scope.selectChatter = function(connection) {
            var selectedChatterIndexOf = $scope.connections.indexOf(connection);

            $scope.selectedChatter = $scope.connections[selectedChatterIndexOf];
            $scope.figureOutItemsToDisplay();
          };

          $scope.unselectChatter = function() {
            $scope.selectedChatter = undefined;
            $scope.figureOutItemsToDisplay();
          };

          $scope.createChat = function() {
            var chatCheck = $scope.chats.filter(function(chat) {
              return chat.members.some(function(user) {
                return user._id === $scope.selectedChatter._id;
              });
            });

            // chat already exists
            if (chatCheck.length) {
              $modalInstance.close(chatCheck[0]);
              return;
            }

            // chat doesn't exist yet, create it
            $http.post('/api/chats/' , $scope.selectedChatter)
              .success(function (response) {
                response.recipient = $scope.selectedChatter;
                $modalInstance.close(response);

              }).error(function (response) {
                // Show user error message and clear form
                $scope.error = response.message;
              });
          };
        }]
      });

      modalInstance.result.then(function(chat) {
        $scope.chat = chat;
      });
    };
  }
]);

'use strict';

// Configuring the connections module
angular.module('connections').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Connections',
      state: 'connections',
      type: 'dropdown',
      roles: ['user', 'seller']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'connections', {
      title: 'Show Connections',
      state: 'connections.list',
      roles: ['user', 'seller']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'connections', {
      title: 'Add Connections',
      state: 'connections.create',
      roles: ['user', 'seller']
    });
  }
]);
'use strict';

// Setting up route
angular.module('connections').config(['$stateProvider',
  function ($stateProvider) {
    // connections state routing
    $stateProvider
      .state('connections', {
        abstract: true,
        url: '/connections',
        template: '<ui-view/>'
      })
      .state('connections.list', {
        url: '',
        templateUrl: 'modules/connections/client/views/list-connections.client.view.html',
        data: {
          roles: ['user', 'seller']
        }
      })
      .state('connections.create', {
        url: '/create',
        templateUrl: 'modules/connections/client/views/create-connection.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      })
      .state('connections.view', {
        url: '/:connectionId',
        templateUrl: 'modules/connections/client/views/view-connection.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);

'use strict';

// Connections controller

angular.module('connections').controller('ConnectionsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Connections',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, Authentication, Socket, GetBids, PanelModels, Projects, Connections) {
    $scope.authentication = Authentication;

    Connections.query(function (data) {
      $scope.connections = data;
      $scope.buildPager();
    });

    $scope.inviteByEmail = function(isValid) {
      $scope.success = $scope.error = null;

      console.log(isValid);

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'InviteByEmailForm');

        return false;
      }

      $http.post('/api/connection-auth/send-invite', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;
        console.log(response);

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });

    };

    // Accept User connection invite
    $scope.acceptRequest = function(user) {
      $http.post('/api/connection-auth/accept-invite', user)
        .success(function(response) {
          var conn_index = $scope.connection_requests.indexOf(user);
          $scope.connection_requests[conn_index].isAccepted = true;
          $scope.connection_requests.splice(conn_index, 1);
          $scope.connections.push(user);
        });
    };

    // Add new connection
    $scope.create = function (userId) {
      $scope.error = null;

      // Create new Connection object
      var connection = new Connections({
        user: userId
      });

      // Redirect after save
      connection.$save(function (response) {
        $state.go('connections');

      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'connectionForm');

        return false;
      }

      var connection = $scope.connection;

      connection.$update(function () {
        $state.go('connections.view', {
          connectionId: connection._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function (connection) {
      if (confirm('Are you sure you want to delete this connection?')) {
        if (connection) {
          connection.$remove();

          $scope.connections.splice($scope.connections.indexOf(connection), 1);
        } else {
          $scope.connection.$remove(function () {
            $state.go('connections');
          });
        }
      }
    };

    // Find a list of ALL Connections
    $scope.find = function () {
      Connections.query({}, function(connections) {
        $scope.connections = connections;
      });

      $http.get('/api/connection-requests').success(function(requests) {
        $scope.connection_requests = requests;
      });
    };

    $scope.findOne = function () {
      Connections.get({
        connectionId: $stateParams.connectionId
      }, function(connection) {
        $scope.connection = connection;
      }, function(error) {
        $location.path('/forbidden');
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.connections, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('connections').factory('Connections', ['$resource',
  function ($resource) {
    return $resource('api/connections/:connectionId', {
      connectionId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
'use strict';

angular.module('core.admin').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Admin',
      state: 'admin',
      type: 'dropdown',
      roles: ['admin']
    });
  }
]);

'use strict';

// Setting up route
angular.module('core.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      });
  }
]);

'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
    .state('home', {
      url: '/',
      controller: ["$state", "Authentication", function($state, Authentication) {
        var user = Authentication.user;
        if (user) {
          if (user.roles[0] === 'tempUser' || user.roles[0] === 'tempSeller') {
            $state.go('awaiting-confirmation');
          } else if (user.roles.indexOf('seller') !== -1) {
            $state.go('organizations.view', { organizationId: user.organization });
          } else if (user.roles.indexOf('user') !== -1) {
            $state.go('catalog');
          } 
        } else {
          $state.go('search');
        }
      }]
    })
    // home page for users
    // .state('dashboard', {
    //   url: '/dashboard'
    // })
    .state('search', {
      url: '/search',
      templateUrl: 'modules/core/client/views/search.client.view.html'
    })
    .state('catalog', {
      url: '/catalog?q&man&pow&page',
      templateUrl: 'modules/core/client/views/catalog.client.view.html'
    })
    // .state('welcome', {
    //   url: '/welcome',
    //   templateUrl: 'modules/core/client/views/welcome.client.view.html',
    //   data: {
    //     ignoreState: true
    //   }
    // })
    .state('awaiting-confirmation', {
      url: '/awaiting-confirmation',
      templateUrl: 'modules/core/client/views/awaiting-confirmation.client.view.html',
      controller: ["$state", "Authentication", function($state, Authentication) {
        var user = Authentication.user;
        if (user.verified && user.emailVerified) {
          $state.go('home');
        }
      }]
    })
    // .state('invite', {
    //   url: '/welcome/invite',
    //   templateUrl: 'modules/core/client/views/invite.client.view.html'
    // })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    });
  }
]);

'use strict';

angular.module('core').controller('CatalogController', ['$scope', '$filter', '$http', '$state', '$stateParams', 'Authentication', 'PanelModels',
  function ($scope, $filter, $http, $state, $stateParams, Authentication, PanelModels) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    $scope.search = $stateParams.q;

    $scope.query = {};
    $scope.query.q = $stateParams.q;
    $scope.query.man = $stateParams.man;
    $scope.query.pow = $stateParams.pow;
    $scope.query.page = $stateParams.page;

    // used to toggle filter on xs screen size
    $scope.hiddenFilterClass = 'hidden-xs';

    // initialize panel models
    $http({
      url: '/api/organizations-catalog',
      params: {
        q: $stateParams.q,
        man: $stateParams.man,
        pow: $stateParams.pow,
        page: $stateParams.page
      }
    })
    .success(function(resp) {
      $scope.orgs = resp.orgs;
      $scope.buildPager(resp.count);

      $scope.buildWattCheckboxes();
      $scope.buildOrgCheckboxes();
    });

    $scope.updateFilter = function() {
      var man = '';
      var pow = '';

      // find all checked boxes for wattage
      for (var key in $scope.wattCheckboxes) {
        if ($scope.wattCheckboxes[key]) {
          pow += $scope.rangesReverse[key] + '|';
        }
      }

      // find all checked manufacturers
      for (key in $scope.orgCheckboxes) {
        if ($scope.orgCheckboxes[key]) {
          man += key + '|';
        }
      }

      $scope.query.man = man;
      $scope.query.pow = pow;
      $scope.query.page = 1;
      $state.go('catalog', $scope.query);
    };


    $scope.toggleFilter = function() {
      $scope.hiddenFilterClass = $scope.hiddenFilterClass ? '' : 'hidden-xs';
    };

    $scope.buildWattCheckboxes = function() {
      $scope.ranges = {
        '100': '0 - 100 Watts',
        '200': '101 - 200 Watts',
        '300': '201 - 300 Watts',
        '400': '301 - 400 Watts',
        '500': '401 - 500 Watts'
      };

      $scope.rangesReverse = {
        '0 - 100 Watts': '100',
        '101 - 200 Watts': '200',
        '201 - 300 Watts': '300',
        '301 - 400 Watts': '400',
        '401 - 500 Watts': '500'
      };

      $scope.wattCheckboxes = {};
      var queryCheckedBoxes = $stateParams.pow ? $stateParams.pow.split('|') : [];
      for (var range in $scope.ranges) {
        $scope.wattCheckboxes[$scope.ranges[range]] = queryCheckedBoxes.indexOf(range) !== -1 ? true : false;
      }
    };

    $scope.buildOrgCheckboxes = function() {
      $http.get('/api/panelmodels-manufacturers')
        .success(function(data) {
          $scope.manufacturers = data;
          $scope.orgCheckboxes = {};
          var queryCheckedBoxes = $stateParams.man ? $stateParams.man.split('|') : [];
          data.forEach(function(manufacturer) {
            $scope.orgCheckboxes[manufacturer] = queryCheckedBoxes.indexOf(manufacturer) !== -1 ? true : false;
          });
        });
    };

    $scope.buildPager = function (count) {
      $scope.itemsPerPage = 15;
      $scope.totalCount = count;
      $scope.currentPage = $stateParams.page;
    };

    $scope.pageChanged = function () {
      $scope.query.page = $scope.currentPage;
      $state.go('catalog', $scope.query);
    };

    $scope.searchSubmit = function() {
      $scope.query.q = $scope.search;
      $state.go('catalog', $scope.query);
    };
  }
]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus',
  function ($scope, $state, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);

'use strict';

angular.module('core').controller('HomeController', ['$scope', '$state', 'Authentication',
  function ($scope, $state, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.goToCatalog = function() {
      $state.go('catalog');
    };
  }
]);

'use strict';

// Credit: http://jsfiddle.net/guxxL9Lw/
angular.module('core').directive('countdown', [
  'Util',
  '$interval',
  function(Util, $interval) {
    return {
      restrict: 'A',
      scope: {
        date: '='
      },
      link: function(scope, element, attrs) {
        var future;

        // wait for date variable to be initialized
        var watcher = scope.$watch('date', function() {
          if (scope.date === undefined) console.log(attrs);
          future = new Date(scope.date);
        });

        $interval(function() {
          var diff;
          diff = Math.floor((future.getTime() - new Date().getTime()) / 1000);
          return element.text(Util.dhms(diff));
        }, 1000);
      }
    };
  }
]).factory('Util', [function() {
  return {
    dhms: function(t) {
      var days, hours, minutes, seconds;
      days = Math.floor(t / 86400);
      t -= days * 86400;
      hours = Math.floor(t / 3600) % 24;
      t -= hours * 3600;
      minutes = Math.floor(t / 60) % 60;
      t -= minutes * 60;
      seconds = t % 60;
      return [
        days + 'd',
        hours + 'h',
        minutes + 'm',
        seconds + 's'
      ].join(' ');
    }
  };
}]);
'use strict';

/**
 * Edits by Ryan Hutchison
 * Credit: https://github.com/paulyoder/angular-bootstrap-show-errors */

angular.module('core')
  .directive('showErrors', ['$timeout', '$interpolate', function ($timeout, $interpolate) {
    var linkFn = function (scope, el, attrs, formCtrl) {
      var inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses,
        initCheck = false,
        showValidationMessages = false,
        blurred = false;

      options = scope.$eval(attrs.showErrors) || {};
      showSuccess = options.showSuccess || false;
      inputEl = el[0].querySelector('.form-control[name]') || el[0].querySelector('[name]');
      inputNgEl = angular.element(inputEl);
      inputName = $interpolate(inputNgEl.attr('name') || '')(scope);

      if (!inputName) {
        throw 'show-errors element has no child input elements with a \'name\' attribute class';
      }

      var reset = function () {
        return $timeout(function () {
          el.removeClass('has-error');
          el.removeClass('has-success');
          showValidationMessages = false;
        }, 0, false);
      };

      scope.$watch(function () {
        return formCtrl[inputName] && formCtrl[inputName].$invalid;
      }, function (invalid) {
        return toggleClasses(invalid);
      });

      scope.$on('show-errors-check-validity', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          initCheck = true;
          showValidationMessages = true;

          return toggleClasses(formCtrl[inputName].$invalid);
        }
      });

      scope.$on('show-errors-reset', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          return reset();
        }
      });

      toggleClasses = function (invalid) {
        el.toggleClass('has-error', showValidationMessages && invalid);
        if (showSuccess) {
          return el.toggleClass('has-success', showValidationMessages && !invalid);
        }
      };
    };

    return {
      restrict: 'A',
      require: '^form',
      compile: function (elem, attrs) {
        if (attrs.showErrors.indexOf('skipFormGroupCheck') === -1) {
          if (!(elem.hasClass('form-group') || elem.hasClass('input-group'))) {
            throw 'show-errors element does not have the \'form-group\' or \'input-group\' class';
          }
        }
        return linkFn;
      }
    };
  }]);

'use strict';

angular.module('core').factory('authInterceptor', ['$q', '$injector',
  function ($q, $injector) {
    return {
      responseError: function(rejection) {
        if (!rejection.config.ignoreAuthModule) {
          switch (rejection.status) {
            case 401:
              $injector.get('$state').transitionTo('authentication.signin');
              break;
            case 403:
              $injector.get('$state').transitionTo('forbidden');
              break;
          }
        }
        // otherwise, default behaviour
        return $q.reject(rejection);
      }
    };
  }
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [
  function () {
    // Define a set of default roles
    this.defaultRoles = ['user', 'admin'];

    // Define the menus object
    this.menus = {};

    // A private function for rendering decision
    var shouldRender = function (user) {
      if (!!~this.roles.indexOf('*')) {
        return true;
      } else {
        if(!user) {
          return false;
        }
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      }

      return false;
    };

    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exist');
        }
      } else {
        throw new Error('MenuId was not provided');
      }

      return false;
    };

    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      return this.menus[menuId];
    };

    // Add new menu object by menu id
    this.addMenu = function (menuId, options) {
      options = options || {};

      // Create the new menu
      this.menus[menuId] = {
        roles: options.roles || this.defaultRoles,
        items: options.items || [],
        shouldRender: shouldRender
      };

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      delete this.menus[menuId];
    };

    // Add menu item object
    this.addMenuItem = function (menuId, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Push new menu item
      this.menus[menuId].items.push({
        title: options.title || '',
        state: options.state || '',
        type: options.type || 'item',
        class: options.class,
        roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.defaultRoles : options.roles),
        position: options.position || 0,
        items: [],
        shouldRender: shouldRender
      });

      // Add submenu items
      if (options.items) {
        for (var i in options.items) {
          this.addSubMenuItem(menuId, options.state, options.items[i]);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Add submenu item object
    this.addSubMenuItem = function (menuId, parentItemState, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === parentItemState) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: options.title || '',
            state: options.state || '',
            roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : options.roles),
            position: options.position || 0,
            shouldRender: shouldRender
          });
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === menuItemState) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    //Adding the topbar menu
    this.addMenu('topbar', {
      roles: ['*']
    });
  }
]);

'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('Socket', ['Authentication', '$state', '$timeout',
  function (Authentication, $state, $timeout) {
    // Connect to Socket.io server
    this.connect = function () {
      // Connect only when authenticated
      if (Authentication.user) {
        this.socket = io();
      }
    };
    this.connect();

    // Wrap the Socket.io 'on' method
    this.on = function (eventName, callback) {
      if (this.socket) {
        this.socket.on(eventName, function (data) {
          $timeout(function () {
            callback(data);
          });
        });
      }
    };

    // Wrap the Socket.io 'emit' method
    this.emit = function (eventName, data) {
      if (this.socket) {
        this.socket.emit(eventName, data);
      }
    };

    // Wrap the Socket.io 'removeListener' method
    this.removeListener = function (eventName) {
      if (this.socket) {
        this.socket.removeListener(eventName);
      }
    };
  }
]);

'use strict';

// Configuring the organizations module
angular.module('organizations').run(['Menus',
  function (Menus) {
    // Add the projects dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Organizations',
      state: 'organizations',
      type: 'dropdown',
      roles: ['user', 'seller']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'organizations', {
      title: 'Show Organizations',
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
'use strict';

// Setting up route
angular.module('organizations').config(['$stateProvider',
  function ($stateProvider) {
    // organizations state routing
    $stateProvider
      .state('organizations', {
        abstract: true,
        url: '/organizations',
        template: '<ui-view/>'
      })
      .state('organizations.list', {
        url: '',
        templateUrl: 'modules/organizations/client/views/list-organizations.client.view.html',
        data: {
          roles: ['user', 'seller']
        }
      })
      .state('organizations.create', {
        url: '/create',
        templateUrl: 'modules/organizations/client/views/create-organization.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('organizations.view', {
        url: '/:organizationId',
        templateUrl: 'modules/organizations/client/views/view-organization.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      })
      .state('organizations.edit', {
        url: '/:organizationId/edit',
        templateUrl: 'modules/organizations/client/views/edit-organization.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);

'use strict';

// Organizations controller

angular.module('organizations').controller('OrganizationsController', ['$scope', '$state', '$stateParams', '$http', '$location', '$timeout', '$interval', '$filter', '$window', '$modal', 'FileUploader', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects', 'Organizations',
  function ($scope, $state, $stateParams, $http, $location, $timeout, $interval, $filter, $window, $modal, FileUploader, Authentication, Socket, GetBids, PanelModels, Projects, Organizations) {
    $scope.authentication = Authentication;
    $scope.user = Authentication.user;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/organizations/logo/',
      alias: 'newLogo'
    });

    Organizations.query(function (data) {
      $scope.organizations = data;
      $scope.buildPager();
    });

    $scope.loadPanelModelsData = function() {
      $scope.panel_models = [];

      $scope.panelData = PanelModels.query();

      $scope.getMatches = function (text) {
        var filteredItems = $filter('filter')($scope.panelData, {
          $: text
        });

        return filteredItems;
      };
    };

    // Add new organization
    $scope.create = function (isValid) {
      $scope.error = null;

      // Check for form submission errors
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'organizationForm');

        return false;
      }

      // Create new Organization object
      var organization = new Organizations({
        companyName: this.companyName,
        industry: this.industry,
        productTypes: this.product_types,
        panel_models: this.panel_models,
        url: this.url,
        address1: this.address1,
        address2: this.address2,
        city: this.city,
        state: this.state,
        zipcode: this.zipcode,
        country: this.country,
        about: this.about
      });

      // Redirect after save
      organization.$save(function (response) {
        $state.go('organizations.view', {
          organizationId: response._id
        });

      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'organizationForm');

        return false;
      }

      var organization = $scope.organization;

      organization.$update(function () {
        $state.go('organizations.view', {
          organizationId: organization._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function (organization) {
      if (confirm('Are you sure you want to delete this organization?')) {
        if (organization) {
          organization.$remove();

          $scope.organizations.splice($scope.organizations.indexOf(organization), 1);
        } else {
          $scope.organization.$remove(function () {
            $state.go('organizations');
          });
        }
      }
    };

    // Find a list of ALL Organizations
    $scope.find = function () {
      Organizations.query({}, function(organizations) {
        $scope.organizations = organizations;
      });
    };

    $scope.findOne = function () {
      Organizations.get({
        organizationId: $stateParams.organizationId
      }, function(organization) {
        $scope.organization = organization;
        $scope.buildUploader(organization._id);
      }, function(error) {
        $location.path('/forbidden');
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.organizations, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    $scope.buildUploader = function(organizationId) {
      // change uploader url
      $scope.uploader.url = 'api/organizations/logo/' + organizationId;

          // Set file uploader image filter
      $scope.uploader.filters.push({
        name: 'imageFilter',
        fn: function (item, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      });

      // Called after the user selected a new picture file
      $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
          var fileReader = new FileReader();
          fileReader.readAsDataURL(fileItem._file);

          fileReader.onload = function (fileReaderEvent) {
            $timeout(function () {
              $scope.organization.logoImageUrl = fileReaderEvent.target.result;
            }, 0);
          };
        }
      };

      $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        // Show success message
        $scope.success = true;

        // Populate organization object
        $scope.organization = response;

        // Clear upload buttons
        $scope.cancelUpload();
      };

      // Called after the user has failed to uploaded a new picture
      $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
        // Clear upload buttons
        $scope.cancelUpload();

        // Show error message
        $scope.error = response.message;
      };

      // Change user profile picture
      $scope.uploadProfilePicture = function () {
        // Clear messages
        $scope.success = $scope.error = null;

        // Start upload
        $scope.uploader.uploadAll();
      };

      // Cancel the upload process
      $scope.cancelUpload = function () {
        $scope.uploader.clearQueue();
        $scope.imageURL = $scope.user.profileImageURL;
      };
    };

    // popup dialog that allows user to create a review
    $scope.showReviewView = function(ev, organizationId) {
      var modalInstance = $modal.open({
        templateUrl: '/modules/reviews/client/views/create-review.client.view.html',
        controller: 'CreateReviewsController',
        resolve: {
          modalOrganizationId: function() {
            return organizationId;
          }
        },
        windowClass: 'app-modal-window'
      });

      modalInstance.result.then(function() {
        if (organizationId) {
          $scope.findOne();
        }
      });
    };

    $scope.showAddUsers = function(ev) {
      console.log(ev);

      var modalInstance = $modal.open({
        templateUrl: '/modules/organizations/client/views/add-users.client.view.html',
        windowClass: 'app-modal-window',
        controller: ["$scope", "$http", "$modalInstance", "Users", function($scope, $http, $modalInstance, Users) {
          $scope.addedUsers = [];
          $scope.potentialUsers = $scope.organization.possibleUsers;

          $scope.buildPager = function () {
            $scope.pagedItems = [];
            $scope.itemsPerPage = 5;
            $scope.currentPage = 1;
            $scope.figureOutItemsToDisplay();
          };

          $scope.figureOutItemsToDisplay = function () {
            $scope.filteredItems = $filter('filter')($scope.potentialUsers, {
              $: $scope.search
            });
            $scope.filterLength = $scope.filteredItems.length;
            var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
            var end = begin + $scope.itemsPerPage;
            $scope.pagedItems = $scope.filteredItems.slice(begin, end);
          };

          // build page after defining necessary functions
          $scope.buildPager();

          $scope.pageChanged = function () {
            $scope.figureOutItemsToDisplay();
          };

          $scope.toggle = function(user) {
            var potentialUsersIndexOf = $scope.potentialUsers.indexOf(user);
            var addedUsersIndexOf = $scope.addedUsers.indexOf(user);

            // move user to addedUsers array
            if (potentialUsersIndexOf !== -1 && addedUsersIndexOf === -1) {
              $scope.addedUsers.push($scope.potentialUsers.splice(potentialUsersIndexOf, 1)[0]);
            // remove user from addedUsers and move back to users
            } else if (potentialUsersIndexOf === -1 && addedUsersIndexOf !== -1) {
              $scope.potentialUsers.push($scope.addedUsers.splice(addedUsersIndexOf, 1)[0]);
            }

            $scope.figureOutItemsToDisplay();
          };

          $scope.acceptUsers = function() {
            $http.post('/api/organizations/' + $scope.organization._id + '/addUsers', $scope.addedUsers)
              .success(function (response) {

                $scope.organization = response;
                $modalInstance.close();

              }).error(function (response) {
                // Show user error message and clear form
                $scope.error = response.message;
              });
          };
        }],
        scope: $scope
      });

      modalInstance.result.then(function() {
        $scope.findOne();
      });
    };
  }
]);

'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('organizations').factory('Organizations', ['$resource',
  function ($resource) {
    return $resource('api/organizations/:organizationId', {
      organizationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
'use strict';

angular.module('panels').controller('PanelController', ['$scope', '$stateParams', '$filter', '$timeout', '$window', 'FileUploader', 'PanelModels',
  function ($scope, $stateParams, $filter, $timeout, $window, FileUploader, PanelModels) {
    PanelModels.query(function (data) {
      $scope.panel_models = data;
      $scope.buildPager();
    });

    $scope.findOne = function() {
      PanelModels.get({
        panelId: $stateParams.panelId
      }, function(panel) {
        $scope.panel = panel;
        $scope.buildUploader(panel._id);
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.panel_models, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/panels/photo/',
      alias: 'newPanelModelPhoto'
    });

    $scope.buildUploader = function(panelId) {
      // change uploader url
      $scope.uploader.url = 'api/panels/photo/' + panelId;

          // Set file uploader image filter
      $scope.uploader.filters.push({
        name: 'imageFilter',
        fn: function (item, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      });

      // Called after the user selected a new picture file
      $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
          var fileReader = new FileReader();
          fileReader.readAsDataURL(fileItem._file);

          fileReader.onload = function (fileReaderEvent) {
            $timeout(function () {
              $scope.panel.panelPhotoUrl = fileReaderEvent.target.result;
            }, 0);
          };
        }
      };

      $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        // Show success message
        $scope.success = true;

        // Clear upload buttons
        $scope.cancelUpload();
      };

      // Called after the user has failed to uploaded a new picture
      $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
        // Clear upload buttons
        $scope.cancelUpload();

        // Show error message
        $scope.error = response.message;
      };

      // Change user profile picture
      $scope.uploadProfilePicture = function (panelId) {
        // Clear messages
        $scope.success = $scope.error = null;
        console.log('inside panelPhoto upload');

        // Start upload
        $scope.uploader.uploadAll();
      };

      // Cancel the upload process
      $scope.cancelUpload = function () {
        $scope.uploader.clearQueue();
        $scope.imageURL = $scope.panel.panelPhotoUrl;
      };
    };
  }
]);

'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('panels').factory('PanelModels', ['$resource',
  function ($resource) {
    return $resource('api/panelmodels/:panelId', {
      organizationId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
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

'use strict';

// Setting up route
angular.module('projects').config(['$stateProvider',
  function ($stateProvider) {
    // projects state routing
    $stateProvider
      .state('projects', {
        abstract: true,
        url: '/projects',
        template: '<ui-view/>'
      })
      .state('projects.list', {
        url: '',
        templateUrl: 'modules/projects/client/views/list-projects.client.view.html',
        data: {
          roles: ['user', 'seller']
        }
      })
      .state('projects.create', {
        url: '/create',
        templateUrl: 'modules/projects/client/views/create-project.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('projects.view', {
        url: '/:projectId',
        templateUrl: 'modules/projects/client/views/view-project.client.view.html'
      })
      .state('projects.edit', {
        url: '/:projectId/edit',
        templateUrl: 'modules/projects/client/views/edit-project.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);

'use strict';

// Projects controller

angular.module('projects').controller('ProjectsController', ['$scope', '$state', '$stateParams', '$location', '$timeout', '$interval', '$filter', '$modal', 'Authentication', 'Socket', 'GetBids', 'PanelModels', 'Projects',
  function ($scope, $state, $stateParams, $location, $timeout, $interval, $filter, $modal, Authentication, Socket, GetBids, PanelModels, Projects) {
    $scope.authentication = Authentication;

    // Connect socket
    if (!Socket.socket) {
      Socket.connect();
      console.log('connected to server');
    }

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('refreshProjectView');
      Socket.removeListener('refreshProjectList');
    });

    Socket.on('refreshProjectView', function(project_id) {
      if ($stateParams.projectId === project_id) {
        $scope.findOne();
      }
    });

    Socket.on('refreshProjectList', function(user_id) {
      if (Authentication.user.roles[0] === 'seller' &&
            $location.url() === '/projects') {
        $scope.find();
      }
      else if (Authentication.user._id === user_id) {
        $scope.find();
      }
    });

    Socket.on('bidDeadlineList', function(project_id) {
      console.log('Bid has terminated');
      console.log(project_id);
      console.log('State param is: ' + $stateParams.projectId);

      if ($scope.project && $stateParams.projectId === project_id) {
        $scope.project.canBid = false;
        $scope.project.bidOpen = false;
        console.log('WE ARE IN PROJECT VIEW');
      }

      else if ($location.url() === '/projects' && $scope.projects) {
        console.log('WE ARE IN PROJECT LIST');
        for(var i=0;i<$scope.projects.length;i++) {
          if ($scope.projects[i]._id === project_id) {
            $scope.projects[i].canBid = false;
            $scope.projects[i].bidOpen = false;
            return;
          }
        }
      }
    });

    // Create new Project
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'projectForm');

        return false;
      }

      if (!$scope.panel_models.length) {
        $scope.error = 'At least one panel model is required';
        return false;
      }

      // Create new Project object
      var project = new Projects({
        note: this.note,
        quantity: this.quantity,
        bid_deadline: this.bid_date.value,
        panel_models: this.panel_models,
        project_state: this.project_state,
        shipping_address_1: this.shipping_address_1,
        shipping_address_2: this.shipping_address_2,
        shipping_address_city: this.shipping_address_city,
        shipping_address_state: this.shipping_address_state,
        shipping_address_zip_code: this.shipping_address_zip_code,
        shipping_address_country: this.shipping_address_country,
        preferred_payment_term: this.preferred_payment_term
      });

      // Redirect after save
      project.$save(function (response) {
        $location.path('projects/' + response._id);

        // Clear form fields
        $scope.note = '';
        $scope.quantity = '';
        $scope.bid_deadline = '';
        $scope.shipping_address_1 = '';
        $scope.shipping_address_2 = '';
        $scope.shipping_address_city = '';
        $scope.shipping_address_state = '';
        $scope.shipping_address_zip_code = '';
        $scope.shipping_address_country = '';
        $scope.preferred_payment_term = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Project
    $scope.remove = function (project) {
      if (project) {
        project.$remove();

        for (var i in $scope.projects) {
          if ($scope.projects[i] === project) {
            $scope.Projects.splice(i, 1);
          }
        }
      } else {
        $scope.project.$remove(function () {
          $location.path('projects');
        });
      }
    };

    // Update existing Project
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!$scope.project.panel_models.length) {
        $scope.error = 'At least one panel model is required';
        return false;
      }

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'projectForm');

        return false;
      }

      var project = $scope.project;

      project.$update(function () {
        $location.path('projects/' + project._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // popup dialog that allows user to place a bid
    $scope.showBidView = function(ev, projectId) {
      console.log(ev);
      console.log($state.href('bids.create', { projectId: $stateParams.projectId }, { absolute: true, inherit: false }));
      console.log(angular.element);
      var modalInstance = $modal.open({
        templateUrl: '/modules/bids/client/views/create-bid.client.view.html',
        controller: 'CreateBidController',
        resolve: {
          modalProjectId: function() {
            return projectId;
          }
        },
        windowClass: 'app-modal-window'
      });

      modalInstance.result.then(function() {
        if (projectId) {
          $scope.find();
        } else {
          $scope.findOne();
        }
      });
    };

    // popup dialog that allows project owner to invite bidders on private project
    $scope.showAddBidders = function(ev) {
      console.log(ev);
      if ($scope.project.project_state !== 'private') return false;

      var modalInstance = $modal.open({
        templateUrl: '/modules/projects/client/views/add-bidders.client.view.html',
        windowClass: 'app-modal-window',
        controller: ["$scope", "$http", "$modalInstance", function($scope, $http, $modalInstance) {
          $scope.addedBidders = [];
          $scope.potentialBidders = $scope.project.user.connections.slice();

          $scope.buildPager = function () {
            $scope.pagedItems = [];
            $scope.itemsPerPage = 15;
            $scope.currentPage = 1;
            $scope.figureOutItemsToDisplay();
          };

          $scope.figureOutItemsToDisplay = function () {
            $scope.filteredItems = $filter('filter')($scope.potentialBidders, {
              $: $scope.search
            });
            $scope.filterLength = $scope.filteredItems.length;
            var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
            var end = begin + $scope.itemsPerPage;
            $scope.pagedItems = $scope.filteredItems.slice(begin, end);
          };

          $scope.pageChanged = function () {
            $scope.figureOutItemsToDisplay();
          };

          // for pagination
          $scope.buildPager();

          $scope.toggle = function(connection) {
            var potentialBiddersIndexOf = $scope.potentialBidders.indexOf(connection);
            var addedBiddersIndexOf = $scope.addedBidders.indexOf(connection);

            // move connection to addedBidders array
            if (potentialBiddersIndexOf !== -1 && addedBiddersIndexOf === -1) {
              $scope.addedBidders.push($scope.potentialBidders.splice(potentialBiddersIndexOf, 1)[0]);
            // remove connection from addedBidders and move back to connections
            } else if (potentialBiddersIndexOf === -1 && addedBiddersIndexOf !== -1) {
              $scope.potentialBidders.push($scope.addedBidders.splice(addedBiddersIndexOf, 1)[0]);
            }

            $scope.figureOutItemsToDisplay();
          };

          $scope.acceptBidders = function() {
            $http.post('/api/projects/' + $scope.project._id + '/inviteBidders', $scope.addedBidders)
              .success(function (response) {
                $modalInstance.close();

              }).error(function (response) {
                // Show user error message and clear form
                $scope.error = response.message;
              });
          };
        }],
        scope: $scope
      });

      modalInstance.result.then(function() {
        $scope.findOne();
      });
    };

    // Find a list of ALL Projects
    $scope.find = function () {
      $scope.projects = Projects.query({}, function(projects) {
        var currentDate = new Date();

        // add a boolean to see if possible to bid on project
        projects.forEach(function(project) {
          project.canBid = $scope.authentication.user.roles[0] === 'seller' && currentDate < new Date(project.bid_deadline);
          project.bidOpen = (currentDate < new Date(project.bid_deadline));
        });
      });
    };

    // Find existing Project
    $scope.findOne = function () {
      $scope.project = Projects.get({
        projectId: $stateParams.projectId
      }, function(project) {
        $scope.project.bid_deadline = new Date(project.bid_deadline);
        $scope.project.canBid = ($scope.authentication.user.roles[0] === 'seller') && (new Date() < new Date(project.bid_deadline));
        $scope.project.bidOpen = (new Date() < new Date(project.bid_deadline));
        $scope.bid_date = {
          currentDate: new Date(),
          yearAheadDate: new Date().setFullYear(new Date().getFullYear() + 1)
        };
      }, function(error) {
        $location.path('/forbidden');
      });
    };

    $scope.myDta = PanelModels.query();

    $scope.getMatches = function (text) {
      var filteredItems = $filter('filter')($scope.myDta, {
        $: text
      });

      return filteredItems;
    };

    $scope.createDate = function() {
      $scope.panel_models = [];
      var min = new Date();

      var now = new Date();
      now.setDate(now.getDate() + 1);

      var max = new Date();
      max.setFullYear(max.getFullYear() + 1);

      $scope.bid_date = {
        value: now,
        currentDate: min,
        yearAheadDate: max
      };
    };
  }
]);

'use strict';

//Projects service used for communicating with the projects REST endpoints
angular.module('projects').factory('Projects', ['$resource',
  function ($resource) {
    return $resource('api/projects/:projectId', {
      projectId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('projects').factory('GetBids', [
  '$resource', function ($resource) {
    return $resource('api/projects/getbids/:projectId');
  }
]);

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

'use strict';

// Setting up route
angular.module('reviews').config(['$stateProvider',
  function ($stateProvider) {
    // Reviews state routing
    $stateProvider
      .state('reviews', {
        abstract: true,
        url: '/reviews',
        template: '<ui-view/>'
      })
      .state('reviews.list', {
        url: '',
        templateUrl: 'modules/reviews/client/views/list-reviews.client.view.html'
      })
      .state('reviews.view', {
        url: '/:reviewId',
        templateUrl: 'modules/reviews/client/views/view-review.client.view.html'
      })
      .state('reviews.edit', {
        url: '/:reviewId/edit',
        templateUrl: 'modules/reviews/client/views/edit-review.client.view.html',
        data: {
          roles: ['user', 'seller', 'admin']
        }
      });
  }
]);

'use strict';

// Reviews controller
angular.module('reviews').controller('CreateReviewsController', ['$scope', '$stateParams', '$location', '$http', '$modalInstance', 'Authentication', 'Reviews', 'modalOrganizationId',
  function ($scope, $stateParams, $location, $http, $modalInstance, Authentication, Reviews, modalOrganizationId) {
    $scope.authentication = Authentication;

    // Create new Review
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reviewForm');

        return false;
      }

      // Create new Review object
      var review = new Reviews({
        title: this.title,
        rating: this.rating,
        content: this.content,
        anonymous: this.anonymous
      });

      // Redirect after save
      $http.post('/api/reviews/create/' + modalOrganizationId, review)
        .success(function (response) {
          $modalInstance.close();
        })
        .error(function (errorResponse) {
          if (errorResponse && errorResponse.message) {
            $scope.error = errorResponse.message;
          }
          else {
            $scope.error = 'Something went wrong...';
          }
        });
    };
  }
]);

'use strict';

// Reviews controller
angular.module('reviews').controller('ReviewsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Reviews',
  function ($scope, $stateParams, $location, Authentication, Reviews) {
    $scope.authentication = Authentication;

    // Remove existing Review
    $scope.remove = function (review) {
      if (review) {
        review.$remove();

        for (var i in $scope.reviews) {
          if ($scope.reviews[i] === review) {
            $scope.reviews.splice(i, 1);
          }
        }
      } else {
        $scope.review.$remove(function () {
          $location.path('reviews');
        });
      }
    };

    // Update existing Review
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'reviewForm');

        return false;
      }

      var review = $scope.review;

      review.$update(function () {
        $location.path('reviews/' + review._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Reviews
    $scope.find = function () {
      $scope.reviews = Reviews.query();
    };

    // Find existing Review
    $scope.findOne = function () {
      $scope.review = Reviews.get({
        reviewId: $stateParams.reviewId
      });
    };
  }
]);

'use strict';

//Reviews service used for communicating with the reviews REST endpoints
angular.module('reviews').factory('Reviews', ['$resource',
  function ($resource) {
    return $resource('api/reviews/:reviewId', {
      reviewId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Configuring the Articles module
angular.module('users.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Users',
      state: 'admin.users'
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'View Panel Models',
      state: 'panels.list'
    });

    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Organizations',
      state: 'admin.organizations'
    });
  }
]);

'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.organizations', {
        url: '/organizations/',
        templateUrl: 'modules/organizations/client/views/admin-list-organizations.client.view.html',
        controller: 'AdminOrganizationsController',
        data: {
          roles: ['admin']
        }
      })
      .state('panels', {
        abstract: true,
        url: '/panels',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      })
      .state('panels.list', {
        url: '/panels-list',
        templateUrl: 'modules/panels/client/views/list-panels.client.view.html',
        controller: 'PanelController',
        data: {
          roles: ['admin']
        }
      })
      .state('panels.view', {
        url: '/:panelId',
        templateUrl: 'modules/panels/client/views/view-panel.client.view.html',
        controller: 'PanelController',
        data: {
          roles: ['admin']
        }
      });
  }
]);

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider
      .state('settings', {
        abstract: true,
        url: '/settings',
        templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
        data: {
          roles: ['user', 'admin', 'seller']
        }
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
      })
      .state('settings.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
      })
      .state('settings.accounts', {
        url: '/accounts',
        templateUrl: 'modules/users/client/views/settings/manage-social-accounts.client.view.html'
      })
      .state('settings.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html'
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        templateUrl: 'modules/users/client/views/authentication/authentication.client.view.html'
      })
      .state('authentication.signup', {
        url: '/signup?i',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html'
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html'
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
      });
  }
]);

'use strict';

angular.module('users.admin').controller('AdminOrganizationsController', ['$scope', '$http', '$filter', 'Admin',
  function ($scope, $http, $filter, Admin) {

    $scope.find = function() {
      $http.get('/api/organizations-unverified')
      .success(function(organizations) {
        $scope.organizations = organizations;
        $scope.buildPager();
      });
    };

    $scope.verifyOrg = function(organizationId) {
      $http.post('/api/organizations/' + organizationId + '/verify')
      .success(function(organization) {
        $scope.organization = organization;
      });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {

      $scope.filteredItems = $filter('filter')($scope.organizations, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

angular.module('users.admin').controller('UserListController', ['$scope', '$http', '$filter', 'Admin',
  function ($scope, $http, $filter, Admin) {
    Admin.query(function (data) {
      $scope.users = data;
      $scope.buildPager();
    });

    // get all users
    $scope.getAllUsers = function() {
      Admin.query(function (data) {
        $scope.users = data;
        $scope.buildPager();
      });
    };

    $scope.getFilteredUsers = function(query) {
      $http.get('/api/users?filter=' + query)
        .success(function(users) {
          $scope.users = users;
          $scope.buildPager();
        })
        .error(function(err) {
          console.log('could not fetch verified users');
        });
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.users, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

angular.module('users.admin').controller('UserController', ['$scope', '$state', '$http', 'Authentication', 'userResolve',
  function ($scope, $state, $http, Authentication, userResolve) {
    $scope.authentication = Authentication;
    $scope.user = userResolve;

    $scope.remove = function (user) {
      if (confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          $scope.users.splice($scope.users.indexOf(user), 1);
        } else {
          $scope.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    };

    $scope.verifyUser = function() {
      if (!$scope.user.verified) {
        $http.post('/api/users/' + $scope.user._id + '/verify')
          .success(function(user) {
            $state.reload();
          })
          .error(function(err) {
            console.log(err);
          });
      }
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = $scope.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator', 'Organizations',
  function ($scope, $state, $http, $location, $window, Authentication, PasswordValidator, Organizations) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    $http.get('/api/organizations-basic')
      .success(function(data) {
        $scope.organizations = data;
      })
      .error(function(err) {
        console.log(err);
      });

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $scope.credentials.inviteToken = $state.params.i;
      $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication', 'PasswordValidator',
  function ($scope, $stateParams, $http, $location, Authentication, PasswordValidator) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    //If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    // Submit forgotten password account id
    $scope.askForPasswordReset = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'forgotPasswordForm');

        return false;
      }

      $http.post('/api/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'resetPasswordForm');

        return false;
      }

      $http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangePasswordController', ['$scope', '$http', 'Authentication', 'PasswordValidator',
  function ($scope, $http, Authentication, PasswordValidator) {
    $scope.user = Authentication.user;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Change user password
    $scope.changeUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'passwordForm');

        return false;
      }

      $http.post('/api/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'passwordForm');
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangeProfilePictureController', ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader',
  function ($scope, $timeout, $window, Authentication, FileUploader) {
    $scope.user = Authentication.user;
    $scope.imageURL = $scope.user.profileImageURL;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/users/picture',
      alias: 'newProfilePicture'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Populate user object
      $scope.user = Authentication.user = response;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = $scope.user.profileImageURL;
    };
  }
]);

'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = new Users($scope.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'userForm');

        $scope.success = true;
        Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('SocialAccountsController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // Check if there are additional accounts
    $scope.hasConnectedAdditionalSocialAccounts = function (provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }

      return false;
    };

    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function (provider) {
      return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
    };

    // Remove a user social account
    $scope.removeUserSocialAccount = function (provider) {
      $scope.success = $scope.error = null;

      $http.delete('/api/users/accounts', {
        params: {
          provider: provider
        }
      }).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // get user organization
    $http.get('api/organizations/' + $scope.user.organization)
      .success(function(org) {
        $scope.user.organization = org;
      });
  }
]);

'use strict';

angular.module('users')
  .directive('passwordValidator', ['PasswordValidator', function(PasswordValidator) {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$validators.requirements = function (password) {
          var status = true;
          if (password) {
            var result = PasswordValidator.getResult(password);
            var requirementsIdx = 0;

            // Requirements Meter - visual indicator for users
            var requirementsMeter = [
              { color: 'danger', progress: '20' },
              { color: 'warning', progress: '40' },
              { color: 'info', progress: '60' },
              { color: 'primary', progress: '80' },
              { color: 'success', progress: '100' }
            ];

            if (result.errors.length < requirementsMeter.length) {
              requirementsIdx = requirementsMeter.length - result.errors.length - 1;
            }

            scope.requirementsColor = requirementsMeter[requirementsIdx].color;
            scope.requirementsProgress = requirementsMeter[requirementsIdx].progress;

            if (result.errors.length) {
              scope.popoverMsg = PasswordValidator.getPopoverMsg();
              scope.passwordErrors = result.errors;
              status = false;
            } else {
              scope.popoverMsg = '';
              scope.passwordErrors = [];
              status = true;
            }
          }
          return status;
        };
      }
    };
  }]);

'use strict';

angular.module('users')
  .directive('passwordVerify', [function() {
    return {
      require: 'ngModel',
      scope: {
        passwordVerify: '='
      },
      link: function(scope, element, attrs, ngModel) {
        var status = true;
        scope.$watch(function() {
          var combined;
          if (scope.passwordVerify || ngModel) {
            combined = scope.passwordVerify + '_' + ngModel;
          }
          return combined;
        }, function(value) {
          if (value) {
            ngModel.$validators.passwordVerify = function (password) {
              var origin = scope.passwordVerify;
              return (origin !== password) ? false : true;
            };
          }
        });
      }
    };
  }]);

'use strict';

// Users directive used to force lowercase input
angular.module('users').directive('lowercase', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function (input) {
        return input ? input.toLowerCase() : '';
      });
      element.css('text-transform', 'lowercase');
    }
  };
});

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
]);

'use strict';

// PasswordValidator service used for testing the password strength
angular.module('users').factory('PasswordValidator', ['$window',
  function ($window) {
    var owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;

    return {
      getResult: function (password) {
        var result = owaspPasswordStrengthTest.test(password);
        return result;
      },
      getPopoverMsg: function () {
        var popoverMsg = 'Please enter a passphrase or password with greater than 10 characters, numbers, lowercase, upppercase, and special characters.';
        return popoverMsg;
      }
    };
  }
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

//TODO this should be Users service
angular.module('users.admin').factory('Admin', ['$resource',
  function ($resource) {
    return $resource('api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
