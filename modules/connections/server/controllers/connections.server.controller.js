'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Connection = mongoose.model('Connection'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current connection
 */
exports.read = function (req, res) {
  res.json(req.onnection);
};

/**
 * Delete a connection
 */
exports.delete = function (req, res) {
  var connection = req.connection;

  connection.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(connection);
  });
};

/**
 * List of current user's Connections
 */
exports.list = function (req, res) {
  Connection.find().sort('-created')
    .populate('user')
    .exec(function (err, connections) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(connections);
  });
};

/**
 * Connection middleware
 */
exports.connectionByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Connection is invalid'
    });
  }

  Connection.findById(id)
    .populate('user')
    .exec(function (err, connection) {
    if (err) {
      return next(err);
    } else if (!connection) {
      return next(new Error('Failed to load connection ' + id));
    }

    req.connection = connection;
    next();
  });
};
