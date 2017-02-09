'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  mongoose = require('mongoose'),
  Organization = mongoose.model('Organization'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto'),
  aws = require('aws-sdk'),
  s3 = new aws.S3();

/**
 * Create a organization
 */
exports.create = function (req, res) {
  var organization = new Organization(req.body);

  organization.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(organization);
    }
  });
};

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
 * List of current All Organizations
 */
exports.list = function (req, res) {
  Organization.find({}, function (err, organizations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(organizations);
  });
};

/**
 * Update org logo
 */
exports.changeLogo = function (req, res) {
  var user = req.user;
  var organization = req.organization;

  var message = null;
  var upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'braquetcompany',
      acl: 'public-read',
      metadata: function(req, file, cb) {
        console.log(file);
        cb(null, file);
      }
    })
  }).single('newLogo');

  var logoUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;
  
  // Filtering to upload only images
  upload.fileFilter = logoUploadFileFilter;

  if (organization) {
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).json(uploadError);
      } else {
        organization.logoImageUrl = req.file.location;

        organization.save(function (saveError) {
          if (saveError) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(saveError)
            });
          } else {
            res.json(organization);
          }
        });
      }
    });

  } else {
    res.status(400).send({
      message: 'Organization does not exist'
    });
  }
};

exports.addUsers = function(req, res) {
  var newUsers = req.body;
  var organization = req.organization;

  organization.users = organization.users.concat(newUsers);
  organization.save(function(err) {
    if (err) {
      res.status(400).json(err);
    } else {
      res.json(organization);
    }
  });
};

exports.getPotentialUsers = function(req, res) {
  var organization = req.organization;
  var org_user_ids = organization.users.map(function(user) { return user._id; });

  User.find({ _id: {$nin : org_user_ids} }, function(err, users) {
    if (err) {
      res.status(400).json(err);
    } else {
      res.json(users);
    }
  });
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

  Organization.findById(id)
    .populate('panel_models')
    .populate('users')
    .exec(function (err, organization) {
    if (err) {
      return next(err);
    } else if (!organization) {
      return next(new Error('Failed to load organization ' + id));
    } 

    req.organization = organization;
    next();
  });
};
