'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  Organization = mongoose.model('Organization'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);  

/**
 * Show the current organization
 */
exports.read = function (req, res) {
  res.json(req.organization);
};

/**
 * Delete a organization
 */
exports.delete = function (req, res) {
  var organization = req.organization;

  organization.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(organization);
  });
};

/**
 * List of current user's Organizations
 */
exports.list = function (req, res) {
  User.find({_id : {$in : req.user.organizations}}, function (err, organizations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(organizations);
  });
};

/**
 * List of user organization requests
 */
exports.listOrganizationRequests = function (req, res) {
  User.find({ _id : {$in : req.user.received_user_invites} }, function(err, requests) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(requests);
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
            else if (existingUser.organizations.indexOf(user._id) !== -1) {
              return res.status(400).send({
                message: "You are already connected to " + existingUser.displayName
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
          res.render(path.resolve('modules/organizations/server/templates/organization-invite-email'), {
            name: user.displayName,
            appName: config.app.title,
            url: httpTransport + req.headers.host + '/api/organization-auth/respond-invite/' + inviteToken
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

exports.acceptUserInvite = function(req, res) {
  User.findOne({_id : req.body._id}, '-salt -password', function(err, invitingUser) {
    if (invitingUser) {
      var sent_index = invitingUser.sent_user_invites.indexOf(req.user._id);
      var recv_index = req.user.received_user_invites.indexOf(invitingUser._id);

      if (sent_index !== -1 && recv_index !== -1) {
        // add user as organization
        invitingUser.organizations.push(req.user._id);
        req.user.organizations.push(invitingUser._id);

        // empty sent_user_invites array
        invitingUser.sent_user_invites.splice(sent_index, 1);
        req.user.received_user_invites.splice(recv_index, 1);

        // update both users
        invitingUser.save(function(err) {
          if (err) {
            console.log('fuck');
          }
          req.user.save(function(err) {
            if (err) {
              console.log('fuck');
            }
            return res.status(200).send({
              message: 'Connected to ' + invitingUser.displayName
            });
          });
        });
      } else {
        return res.status(400).send({
          message: 'Failed to connect'
        });
      }
    } else {
      return res.status(400).send({
          message: 'User does not exist'
        });
    }
  });
};

exports.signupByInviteAndConnect = function(req, res) {
  res.redirect('/authentication/signup?i=' + req.params.inviteToken);
};

/**
 * Organization middleware
 */
exports.organizationByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Organization is invalid'
    });
  }

  User.findById(id , function (err, organization) {
    if (err) {
      return next(err);
    } else if (!organization) {
      return next(new Error('Failed to load organization ' + id));
    } else if (req.user.organizations.indexOf[id] === -1 ) {
      return next(new Error('Not connected to this user'));
    }

    req.organization = organization;
    next();
  });
};
