'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  config = require(path.resolve('./config/config')),
  User = mongoose.model('User'),
  aws = require('aws-sdk'),
  s3 = new aws.S3();

/**
 * Update user details
 */
exports.update = function (req, res) {
  // Init Variables
  var user = req.user;

  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  if (user) {
    // Merge existing user
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.jobTitle = req.body.jobTitle;
    user.updated = Date.now();
    user.displayName = user.firstName + ' ' + user.lastName;

    user.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(user);
          }
        });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var user = req.user;
  var message = null;
  var bucket = process.env.NODE_ENV === 'production' ? 'braquetprofilephotosproduction' : 'braquetprofilephotosdev';

  var upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: bucket,
      acl: 'public-read',
      metadata: function(req, file, cb) {
        console.log(file);
        cb(null, file);
      }
    })
  }).single('newProfilePicture');

  var profileUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = profileUploadFileFilter;

  if (user) {
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).json(uploadError);
      } else {
        var oldImageKey = user.profileImageURL.split('/').pop();
        user.profileImageURL = req.file.location;

        user.save(function (saveError) {
          if (saveError) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(saveError)
            });
          } else {
            req.login(user, function (err) {
              if (err) {
                res.status(400).send(err);
              } else {
                s3.deleteObject({ Bucket: bucket, Key: oldImageKey }, function(err, data) {
                  if (err) {
                    return res.status(400).json(err);
                  } else {
                    res.json(user);
                  }
                });
              }
            });
          }
        });
      }
    });

  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Send User
 */
exports.me = function (req, res) {
  res.json(req.user || null);
};
