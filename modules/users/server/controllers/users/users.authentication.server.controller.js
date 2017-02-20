'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  async = require('async'),
  User = mongoose.model('User'),
  Organization = mongoose.model('Organization');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Signup
 */
exports.signup = function (req, res) {
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  // verify and init organization details
  var organizationId = req.body.organization;
  var organizationForm = req.body.organizationForm;
  var newOrganization;
  delete req.body.organization;
  delete req.body.organizationForm;

  if (organizationId === 'other' && organizationForm.organizationName && organizationForm.organizationWebsite) {
    newOrganization = new Organization({name: organizationForm.organizationName, website: organizationForm.organizationWebsite});
  } else if (organizationId === 'other' && (!organizationForm.organizationName || !organizationForm.organizationWebsite)) {
    return res.status(400).send({
      message: "invalid organization form submission"
    });
  }

  // Init Variables
  var user = new User(req.body);

  // set user organization
  user.organization = organizationId === 'other' ? newOrganization._id : organizationId;

  // Add missing user fields
  user.provider = 'local';
  var displayName = user.firstName + ' ' + user.lastName;
  
  // convert name to title case
  user.displayName = displayName.toLowerCase()
    .split(' ')
    .map(i => i[0].toUpperCase() + i.substring(1))
    .join(' ')
  ;

  // Define user role, seller if user_role = 1 (user_role = 0 defaults to user a.k.a buyer)
  if (req.body.user_role === '1')
    user.roles = ['tempSeller'];
  else {
    user.roles = ['tempUser'];
  }

   // check if user was invited and connect upon signup
  async.waterfall([
    function(done) {
      User.findOne({ 
        inviteToken: req.body.inviteToken,
        sent_email_invites: { $in: [req.body.email] }
        }, function(err, invitingUser) {
        if (invitingUser) {
          // user exists
        }
        done(err, invitingUser);
      });
    },
    function(invitingUser, done) {
      // add user connection if it exists
      if (invitingUser) {
        user.connections.push(invitingUser._id); 
      } 

      // Then save the user
      user.save(function (err) {
          done(err, invitingUser);
      });
    },
    function(invitingUser, done) {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;
      var err = null;

      // update the inviting user if exists
      if (invitingUser) {
        var index = invitingUser.sent_email_invites.indexOf(req.body.email);
        if (index !== -1) {
          invitingUser.sent_email_invites.splice(index, 1);
          invitingUser.connections.push(user._id);
        }

        // save invitingUser
        invitingUser.save(function(err) {
          done(err);
        });
      } else {
        done(err);
      }
    },
    // log in user
    function(done) {
      req.login(user, function (err) {
        done(err, user);
      });
    },
    function(user, done) {
      // handling new user for an existing organization
      if (organizationId !== 'other') {
        Organization.findById(organizationId, function(err, organization) {
          if (err) {
            return res.status(400).json(err);
          } else if (!organization) {
            return res.status(400).send({
              message: 'no organization with that ID exists'
            });
          }

          organization.possibleUsers.push(user._id);
          organization.save(function(err) {
            done(err, user);
          });
        });
      // handling new admin for new organization
      } else {
        newOrganization.verified = false;
        newOrganization.admin = user;

        newOrganization.save(function(err) {
          done(err, user);
        });
      }
    },
    function(user, done) {
      res.json(user);
    }
    ], function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  });
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, function (err, user, redirectURL) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(redirectURL || sessionRedirectURL || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else {
        if (!user) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });

            // And save the user
            user.save(function (err) {
              return done(err, user);
            });
          });
        } else {
          return done(err, user);
        }
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, '/settings/accounts');
      });
    } else {
      return done(new Error('User is already connected using this provider'), user);
    }
  }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};
