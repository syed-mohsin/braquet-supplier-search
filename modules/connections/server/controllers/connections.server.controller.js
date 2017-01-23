'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  Connection = mongoose.model('Connection'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);  

/**
 * Show the current connection
 */
exports.read = function (req, res) {
  res.json(req.connection);
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
  User.find({_id : {$in : req.user.connections}}, function (err, connections) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(connections);
  });
};

/**
 * Send an email invite to user to connect with sending
 */
exports.inviteByEmail = function(req, res, next) {
  var user = req.user;
  var isExistingUser = false;

  async.waterfall([
    function (done) {
      // check if user is associated with email
      User.findOne( { email: req.body.email.toLowerCase() 
      }, '-salt -password', function(err, existingUser) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        else {
          if (existingUser) {
            isExistingUser = true;
            
            // return error if previous invite sent
            if (existingUser.received_user_invites.indexOf(user._id) !== -1) {
              return res.status(400).send({
                message: "You have already invited this user"
              });
            } 
            // return error if inviting oneself (forever alone)
            else if(existingUser._id.toHexString() === user._id.toHexString()) {
              return res.status(400).send({
                message: "You cannot invite yourself"
              });
            }
            // invite user in-app
            else {
              // add existingUsers id to sent_user_invites arr
              user.sent_user_invites.push(existingUser._id);
              user.save(function(err) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                }

                // add user id to received_user_invites arr for existingUser
                existingUser.received_user_invites.push(user._id);
                existingUser.save(function(err) {
                  if (err) {
                    return res.status(400).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  }
                  else {
                    return res.status(200).send({
                      message: "Invite sent sucessfully"
                    });
                  }
                });
              });
            }
          }

          // Generate random token
          if (!isExistingUser){
            done(err, user.inviteToken);
          }
        }
      });
    },
    // store token current user's inviteTokens array
    function (inviteToken, done) {
      if (user.sent_email_invites.indexOf(req.body.email) !== -1) {
        return res.status(400).send({
            message: "You have already invited this user"
          });
      }

      user.sent_email_invites.push(req.body.email);
      user.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        else {
          var httpTransport = 'http://';
          if (config.secure && config.secure.ssl === true) {
            httpTransport = 'https://';
          }
          res.render(path.resolve('modules/connections/server/templates/connection-invite-email'), {
            name: user.displayName,
            appName: config.app.title,
            url: httpTransport + req.headers.host + '/api/connection-auth/respond-invite/' + inviteToken
          }, function (err, emailHTML) {
            done(err, emailHTML);
          });
        }
      });
    },
    function (emailHTML, done) {
      res.json(emailHTML);
    }

    ], function (err) {
      if (err) {
        return next(err);
      }
    });
};

exports.signupByInviteAndConnect = function(req, res) {
  console.log(req.params.inviteToken);
  res.redirect('/authentication/signup?i=' + req.params.inviteToken);
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

  User.findById(id , function (err, connection) {
    if (err) {
      return next(err);
    } else if (!connection) {
      return next(new Error('Failed to load connection ' + id));
    } else if (req.user.connections.indexOf[id] === -1 ) {
      return next(new Error('Not connected to this user'));
    }
    console.log(connection);
    req.connection = connection;
    next();
  });
};
