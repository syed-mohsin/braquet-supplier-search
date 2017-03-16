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
  Review = mongoose.model('Review'),
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
 * Public read view of organization
 */
exports.readPublic = function(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.organizationId)) {
    return res.status(400).send({
      message: 'Organization is invalid'
    });
  }

  Organization.findById(req.params.organizationId)
    .populate('panel_models')
    .populate('reviews')
    .exec(function (err, organization) {
      if (err) {
        return res.status(400).json(err);
      } else if (!organization) {
        return res.status(400).json(new Error('Failed to load organization ' + req.params.organizationId));
      }

      Review.populate(organization.reviews, [
        { path: 'organization' },
        { path: 'user', populate: { path: 'organization', select: 'companyName logoImageUrl' } }
      ], function(err, reviews) {
        if (err) {
          return res.status(400).json(err);
        } else {
          // remove unverified reviews
          organization.reviews = organization.reviews.filter(function(review) {
            return review.verified === true;
          });

          // remove displayName on anonymous reviews
          organization.reviews.map(function(review) {
            if (review.anonymous) {
              review.user.displayName = 'anonymous';
              review.user.firstName = 'anonymous';
              review.user.lastName = 'anonymous';
            }

            return review;
          });

          // calculate avg review
          organization.avg_review = organization.reviews.reduce(function(a,b) {
            return a + b.rating;
          }, 0) / organization.reviews.length || 0;
          res.json(organization);
        }
      });
    });
};

/**
 * Update a organization
 */
exports.update = function (req, res) {
  var organization = req.organization;

  organization.title = req.body.title;
  organization.companyName = req.body.companyName;
  organization.panel_models = req.body.panel_models;
  organization.industry = req.body.industry;
  organization.producTypes = req.body.productTypes;
  organization.url = req.body.url;
  organization.address1 = req.body.address1;
  organization.address2 = req.body.address2;
  organization.city = req.body.city;
  organization.state = req.body.state;
  organization.zipcode = req.body.zipcode;
  organization.country = req.body.country;
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
  Organization.find({}, 'companyName')
  .sort('companyName')
  .exec(function(err, organizations) {
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
  var result = [];
  var queryParams = {}; // query object
  queryParams.verified = true;

  // build query for search using regular expression
  if (req.query.q) queryParams.companyName = new RegExp(req.query.q, 'i');

  // build query for manufacturers
  if (req.query.man) {
    var manCondition = req.query.man.split('|').filter(function(m) { return m.length !== 0; });
    queryParams.panel_manufacturers = { '$in' :  manCondition };
  }

  // build query for crystaline types
  if (req.query.crys) {
    var crysCondition = req.query.crys.split('|').filter(function(c) { return c.length !== 0; });
    queryParams.panel_crystalline_types = { '$in' :  crysCondition };
  }

  // build query for frame colors
  if (req.query.color) {
    var colorCondition = req.query.color.split('|').filter(function(c) { return c.length !== 0; });
    queryParams.panel_frame_colors = { '$in' :  colorCondition };
  }

  // build query for number of cells
  if (req.query.cells) {
    var cellsCondition = req.query.cells.split('|').filter(function(m) { return m.length !== 0; });
    queryParams.panel_number_of_cells = { '$in' :  cellsCondition };
  }

  // build query for wattage filter
  if (req.query.pow) {
    // or statement to check all wattage ranges passed in
    var powerArr = req.query.pow.split('|').filter(function(p) { return p.length !== 0 && !isNaN(p); });
    queryParams.$or = powerArr.map(function(pow) {
      return {
        'panel_stcPowers':
        {
          '$elemMatch':
          {
            '$gt': parseInt(pow)-100,
            '$lte': parseInt(pow)
          }
        }
      };
    });
  }

  var query = Organization.find(queryParams);
  var countQuery = Organization.find(queryParams);

  query.skip((req.query.page - 1 || 0) * 15)
  .populate('reviews')
  .limit(15)
  .exec()
  .then(function(orgs) {
    result = orgs;

    return countQuery.count().exec();
  })
  .then(function(count) {
    // calculate avg reviews for all orgs in this query
    result = result.map(function(org) {
      // remove unverified org reviews
      org.reviews = org.reviews.filter(function(review) {
        return review.verified === true;
      });

      // calculate org average review
      org.avg_review = org.reviews.reduce(function(a,b) {
        return a + b.rating;
      }, 0) / org.reviews.length || 0;

      org.reviews = []; // clear reviews for catalog view
      return org;
    });

    res.json({ orgs: result, count: count });
  })
  .catch(function(err) {
    res.json(err);
  });
};

/**
 * Update org logo
 */
exports.changeLogo = function (req, res) {
  var user = req.user;
  var organization = req.organization;
  var bucket = process.env.NODE_ENV === 'production' ? 'braquetcompanylogosproduction' : 'braquetcompanylogosdev';

  var message = null;
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
            s3.deleteObject({ Bucket: bucket, Key: oldImageKey }, function(err, data) {
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
    .populate('reviews')
    .exec(function (err, organization) {
      if (err) {
        return next(err);
      } else if (!organization) {
        return next(new Error('Failed to load organization ' + id));
      }

      Review.populate(organization.reviews, [
        { path: 'organization' },
        { path: 'user', populate: { path: 'organization', select: 'companyName logoImageUrl' } }
      ], function(err, reviews) {
        if (err) {
          return next(err);
        } else {
          // remove unverified reviews
          organization.reviews = organization.reviews.filter(function(review) {
            return review.verified === true;
          });

          // remove displayName on anonymous reviews
          organization.reviews.map(function(review) {
            if (review.anonymous) {
              review.user.displayName = 'anonymous';
              review.user.firstName = 'anonymous';
              review.user.lastName = 'anonymous';
            }

            return review;
          });

          // calculate average review
          organization.avg_review = organization.reviews.reduce(function(a,b) {
            return a + b.rating;
          }, 0) / organization.reviews.length || 0;
          req.organization = organization;
          return next();
        }
      });
    });
};
