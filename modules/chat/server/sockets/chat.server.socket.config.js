'use strict';

var mongoose = require('mongoose'),
  Chat = mongoose.model('Chat');

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
    // verify chat belongs to user
    var chatId = data.chatId;
    if (!socket.request.user.chats.some(function(chat_id) { return chat_id.equals(chatId); })) {
      console.log('not a valid chat', chatId, socket.request.user.chats);
      return false;
    }

    data.message.type = 'message';
    data.message.created = Date.now();
    data.message.profileImageURL = socket.request.user.profileImageURL;
    data.message.displayName = socket.request.user.displayName;
    data.message.user = socket.request.user;

    Chat.update(
      { _id: chatId },
      { $push: { messages: data.message } },
      function(err) {
        if (err) {
          console.log('error saving message');
          return;
        }
      });

    // get recipient
    var recipients = data.members.filter(function(user) {
      return !socket.request.user._id.equals(user._id);
    });

    // Emit the 'chatMessage' event
    var mySockets = userSockets[socket.request.user._id];
    var recipientSockets = userSockets[recipients[0]._id];
    var targetSockets = mySockets.concat(recipientSockets);
    targetSockets.forEach(function(socketid) {
      io.to(socketid).emit('chatMessage', data);
    });
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
