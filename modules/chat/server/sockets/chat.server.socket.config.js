'use strict';

// Create the chat configuration
module.exports = function (io, socket, userSockets) {
  // // Emit the status event when a new socket client is connected
  // io.emit('chatMessage', {
  //   type: 'status',
  //   text: 'Is now connected',
  //   created: Date.now(),
  //   profileImageURL: socket.request.user.profileImageURL,
  //   username: socket.request.user.username
  // });

  // Send a chat messages to all connected sockets when a message is received
  socket.on('chatMessage', function (data) {
    var chatId = data.chatId;
    data.message.type = 'message';
    data.message.created = Date.now();
    data.message.profileImageURL = socket.request.user.profileImageURL;
    data.message.displayName = socket.request.user.displayName;
    data.message.user = socket.request.user;

    // Emit the 'chatMessage' event
    io.emit('chatMessage', data);
  });

  // // Emit the status event when a socket client is disconnected
  // socket.on('disconnect', function () {
  //   io.emit('chatMessage', {
  //     type: 'status',
  //     text: 'disconnected',
  //     created: Date.now(),
  //     username: socket.request.user.username
  //   });
  // });
};
