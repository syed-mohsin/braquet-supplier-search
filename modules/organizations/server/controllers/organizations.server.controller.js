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
  organization.verified = true;

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
 * Update a organization
 */
exports.update = function (req, res) {
  var organization = req.organization;

  organization.title = req.body.title;
  organization.name = req.body.name;
  organization.panel_models = req.body.panel_models;
  organization.industry = req.body.industry;
  organization.product_types = req.body.product_types;
  organization.website = req.body.website;
  organization.headquarters = req.body.headquarters;
  organization.about = req.body.about;

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
  Organization.find({ verified: true }, function (err, organizations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(organizations);
  });
};

/**
 * List all unverified organizations (Admin only)
 */
exports.list_unverified = function(req, res) {
  Organization.find({ verified: false }, function (err, organizations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(organizations);
  });
};

/**
 * Verify an organization
 */
exports.verify = function(req, res) {
  if (!req.organization || req.organization.verified) {
    res.status(400).send({
      message: 'Invalid organization'
    });
  } else {
    var organization = req.organization;
    organization.verified = true;
    organization.save(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(organization);
    });
  }
};

/**
 * List of only organization names
 */
exports.list_basic = function (req, res) {
  Organization.find({}, 'name', function(err, organizations) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(organizations);
    }
  });
};

/**
 * List of fully populated organizations for catalog
 * Available to all
 */
exports.get_catalog = function (req, res) {
  Organization.find({ verified: true })
    .populate('panel_models')
    .exec(function(err, organizations) {
      if (err) {
        res.status(400).json(err);
      } else {
        res.json(organizations);
      }
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

        var oldImageKey = organization.logoImageUrl.split('/').pop();
        organization.logoImageUrl = req.file.location;

        organization.save(function (saveError) {
          if (saveError) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(saveError)
            });
          } else {
            s3.deleteObject({ Bucket: 'braquetcompany', Key: oldImageKey }, function(err, data) {
              if (err) {
                return res.status(400).json(err);
              } else {
                res.json(organization);
              }
            });
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
      // add organization to all users
      var new_user_ids = newUsers.map(function(user) { return user._id; });
      User.update({ _id: { $in: new_user_ids } }, { $set: { organization: organization._id } },
        { multi: true },
        function(err) {
          if (err) {
            res.status(400).json(err);
          } else {
            res.json(organization);
          }
        });
    }
  });
};

exports.getPotentialUsers = function(req, res) {
  var organization = req.organization;
  var org_user_ids = organization.users.map(function(user) { return user._id; });

  User.find({
    _id: { $nin : org_user_ids },
    organization: { $eq: null } }, function(err, users) {
    if (err) {
      res.status(400).json(err);
    } else {
      res.json(users);
    }
  });
};

/**
 * Set organization Admin
 */
exports.setOrganizationAdmin = function(req, res) {
  var admin = req.body;
  var organization = req.organization;

  if (!organization.admin && admin.organization.equals(organization._id)) {
    organization.admin = admin;
    organization.save(function(err) {
      if (err) {
        res.status(400).json(err);
      } else {
        res.json(organization);
      }
    });
  }
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
    .populate('users', 'displayName organization connections email firstName lastName')
    .populate('possibleUsers', 'displayName organization connections email firstName lastName')
    .populate('admin', 'displayName')
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
