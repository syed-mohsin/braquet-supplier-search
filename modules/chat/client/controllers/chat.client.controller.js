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
      });

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'chatMessage' event
    Socket.on('chatMessage', function (data) {
      var chatId = data.chatId;
      var message = data.message;
      $scope.messages.push(message);
    });

    // Create a controller method for sending messages
    $scope.sendMessage = function () {
      if (!$scope.chat) {
        // return false;
      }

      // Create a new message object
      var message = {
        text: this.messageText,
      };

      var data = {
        chatId: $scope.chat,
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
    }

    // popup dialog that allows users to begin more chats with connections
    $scope.showAddChats = function(ev) {
      console.log(ev);

      var modalInstance = $modal.open({
        templateUrl: '/modules/chat/client/views/add-chats.client.view.html',
        windowClass: 'app-modal-window',
        scope: $scope,
        controller: function($scope, $http, $filter, $modalInstance) {
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
          }

          $scope.createChat = function() {
            var chatCheck = $scope.chats.filter(function(chat) {
              return chat.recipient._id === $scope.selectedChatter._id;
            });

            // chat already exists
            if (chatCheck.length) {
              $modalInstance.close(chatCheck[0]);
              return;
            }
            console.log("chatCheck", chatCheck); return;

            // chat doesn't exist yet, create it
            $http.post('/api/chats/' , $scope.selectedChatter)
              .success(function (response) {
                response.recipient = $scope.selectedChatter;
                $scope.chats.push(response);
                $modalInstance.close(response);

              }).error(function (response) {
                // Show user error message and clear form
                $scope.error = response.message;
              });
          };
        }
      });

      modalInstance.result.then(function(chat) {
        $scope.chat = chat;
      });
    };

  }
]);
