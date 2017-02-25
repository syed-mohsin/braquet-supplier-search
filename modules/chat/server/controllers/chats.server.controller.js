'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  Chat = mongoose.model('Chat'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current chat
 */
exports.read = function (req, res) {
  res.json(req.chat);
};

/**
 * Create new chat
 */
exports.create = function (req, res) {
  var recipient = req.body;

  var chat = new Chat({
    members: [req.user, recipient],
    messages: []
  });

  chat.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.user.chats.push(chat);
      req.user.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          User.findByIdAndUpdate(recipient._id, { $push: { chats: chat } },
            function(err) {
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                // add users object to chat
                chat.members = [req.user, recipient];

                // notify recipient of new chat
                var io = req.app.get('socketio');
                var sockets = req.app.get('socket-users');
                var mySockets = sockets[req.user._id];
                var recipientSockets = sockets[recipient._id];
                var allSockets = mySockets.concat(recipientSockets);
                allSockets.forEach(function(socketId) {
                  io.to(socketId).emit('newChat', chat);
                });

                res.json(chat);
              }
            });
        }
      });
    }
  });
};

/**
 * Delete a chat
 */
exports.delete = function (req, res) {
  var chat = req.chat;

  chat.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(chat);
  });
};

/**
 * List of current user's Chats
 */
exports.list = function (req, res) {
  Chat.find({ _id : { $in : req.user.chats } })
    .populate('members')
    .exec(function (err, chats) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(chats);
    });
};

/**
 * Chat middleware
 */
exports.chatByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Chat is invalid'
    });
  }

  Chat.findById(id)
    .populate('members')
    .exec(function (err, chat) {
      if (err) {
        return next(err);
      } else if (!chat) {
        return next(new Error('Failed to load chat ' + id));
      }

      req.chat = chat;
      next();
    });
};
