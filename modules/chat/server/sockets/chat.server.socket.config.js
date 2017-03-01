'use strict';

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Chat = mongoose.model('Chat');

// Create the chat configuration
module.exports = function (io, socket, userSockets) {
  // send a chat message
  socket.on('chatMessage', function (data) {
    // verify chat belongs to user
    User.findById(socket.request.user._id, 'chats', function(err, user) {
      if (err) {
        console.log('something went wrong with db query');
        return false;
      } else if (!user) {
        console.log('invalid user');
        return false;
      }

      var chatId = data.chatId;
      if (!user.chats.some(function(chat_id) { return chat_id.equals(chatId); })) {
        console.log('not a valid chat', chatId, socket.request.user.chats);
        return false;
      }

      data.message.type = 'message';
      data.message.created = Date.now();
      data.message.profileImageURL = socket.request.user.profileImageURL;
      data.message.displayName = socket.request.user.displayName;
      data.message.user = socket.request.user;

      // add message to chat's message array
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
  });
};
