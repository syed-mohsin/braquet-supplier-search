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
  var chat = new Chat(req.body);

  chat.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(chat);
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
  User.find({ _id : { $in : req.user.chats } })
    .populate('chat')
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

  User.findById(id)
    .populate('chat')
    .exec(function (err, chat) {
      if (err) {
        return next(err);
      } else if (!chat) {
        return next(new Error('Failed to load chat ' + id));
      } else if (req.user.chats.indexOf[id] === -1) {
        return next(new Error('Not connected to this user'));
      }

      req.chat = chat;
      next();
    });
};
