'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }),
  mongoose = require('mongoose'),
  OrganizationService = require('../services/organizations.server.service'),
  ContactOrganization = mongoose.model('ContactOrganization'),
  Organization = mongoose.model('Organization'),
  Review = mongoose.model('Review'),
  PriceReview = mongoose.model('PriceReview'),
  PanelModel = mongoose.model('PanelModel'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  aws = require('aws-sdk'),
  s3 = new aws.S3(),
  smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Contact an organization through Braquet Admin
 */
exports.contact = function (req, res) {

  var contactOrganizationForm = new ContactOrganization(req.body);
  contactOrganizationForm.user = req.user;
  contactOrganizationForm.organization = req.organization;

  var userDisplayName = req.user.displayName;
  var organizationName = req.organization.companyName;

  contactOrganizationForm.save()
  .then(function(savedContactOrganizationForm) {
    return Organization.findOne({ _id: req.user.organization })
    .exec();
  })
  .then(function(organization) {

    // check if organization doesn't exist
    if(!organization) {
      return res.status(400).json({
        message: 'Organization does not exist'
      });
    }

    return new Promise(function(resolve, reject) {

      res.render('modules/organizations/server/templates/contact-supplier', {
        name: userDisplayName,
        userOrg: organization.companyName,
        orgName: organizationName,
        formData: contactOrganizationForm
      }, function(err, emailHTML) {
        if(err) {
          reject(err);
        }
        resolve(emailHTML);
      });
    });
  })
  .then(function(emailHTML) {
    var mailList = process.env.MAILER_INTERNAL_LIST;

    var mailOptions = {
      to: mailList,
      from: process.env.MAILER_EMAIL_ID,
      subject: 'Braquet - Request to Contact a Supplier',
      html: emailHTML
    };

    return mailgun.messages().send(mailOptions);
  })
  .then(function(resp) {
    res.json(resp);
  })
  .catch(function(err) {
    if(err) {
      res.status(400).json(err);
    }
  });

};

/**
 * Create a organization
 */
exports.create = function (req, res) {
  var organization = new Organization(req.body);
  organization.verified = true;
  organization = OrganizationService.cachePanelFields(organization, req.body.panel_models);

  Organization.findOne({ urlName: organization.urlName }).exec()
  .then(function(duplicateOrganization) {
    if (duplicateOrganization) {
      var err = { errors: { duplicate: { message: 'this url display name is already taken' } } };
      throw err;
    }

    // there was no duplicate, proceed to save organization
    return organization.save();
  })
  .then(function(savedOrg) {
    res.json(organization);
  })
  .catch(function(err) {
    res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
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
  organization.companyName = req.body.companyName;
  organization.urlName = req.body.urlName;
  organization.isManufacturer = req.body.isManufacturer;
  organization.panel_models = req.body.panel_models;
  organization.industry = req.body.industry;
  organization.productTypes = req.body.productTypes;
  organization.url = req.body.url;
  organization.address1 = req.body.address1;
  organization.address2 = req.body.address2;
  organization.city = req.body.city;
  organization.state = req.body.state;
  organization.zipcode = req.body.zipcode;
  organization.country = req.body.country;
  organization.about = req.body.about;

  organization = OrganizationService.cachePanelFields(organization, req.body.panel_models);

  Organization.findOne({ urlName: organization.urlName }).exec()
  .then(function(duplicateOrganization) {
    // check for a unique duplicate organization
    if (duplicateOrganization && !duplicateOrganization._id.equals(organization._id)) {
      var err = { errors: { duplicate: { message: 'this url display name is already taken' } } };
      throw err;
    }

    // there was no duplicate, proceed to save organization
    return organization.save();
  })
  .then(function(updatedOrg) {
    res.json(organization);
  })
  .catch(function(err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List of current All Organizations
 */
exports.list = function (req, res) {
  Organization.find({ verified: true })
  .sort('companyName')
  .exec(function (err, organizations) {
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
  var queries = OrganizationService.processQuery(req.query);
  var organizationQueryParams = queries.organizationQueryParams;
  var priceReviewQueryParams = queries.priceReviewQueryParams;

  // for catalog, do a reverse lookup on panels and price reviews
  Organization.find(organizationQueryParams)
  .populate({ path: 'priceReviews', match: priceReviewQueryParams
  })
  .lean() // returns documents as plain JS objects so you can modify them
  .exec()
  .then(function(orgs) {
    // get brands for organizations
    orgs = OrganizationService.extractBrands(orgs);
    // sort organizations
    orgs = OrganizationService.sortByQuery(orgs, req.query);

    var start = (req.query.page - 1 || 0) * 15;
    res.json({ orgs: orgs.slice(start, start + 15), count: orgs.length });
  })
  .catch(function(err) {
    res.status(400).json(err);
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
    .populate({ path: 'reviews', match: { verified: true }, options: { sort: { created: -1 } } })
    .populate({ path: 'priceReviews', match: { verified: true }, options: { sort: { quoteDate: -1 } } })
    .exec(function (err, organization) {
      if (err) {
        return res.status(400).json(err);
      } else if (!organization) {
        return res.status(400).json(new Error('Failed to load organization ' + req.params.organizationId));
      }

      res.json(organization);
    });
};

/**
 * Public read view of organization by url name
 */
exports.readPublicByUrlName = function(req, res) {
  Organization.findOne({ urlName: req.params.urlName })
    .populate('panel_models')
    .populate({ path: 'reviews', match: { verified: true }, options: { sort: { created: -1 } } })
    .populate({ path: 'priceReviews', match: { verified: true }, options: { sort: { quoteDate: -1 } } })
    .exec(function (err, organization) {
      if (err) {
        return res.status(400).json(err);
      } else if (!organization) {
        return res.status(400).json(new Error('Failed to load organization ' + req.params.urlName));
      }

      res.json(organization);
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
    .populate('users', 'displayName organization connections email firstName lastName')
    .populate('possibleUsers', 'displayName organization connections email firstName lastName')
    .populate('admin', 'displayName')
    .populate({ path: 'reviews', match: { verified: true }, options: { sort: { created: -1 } } })
    .populate({ path: 'priceReviews', match: { verified: true }, options: { sort: { quoteDate: -1 } } })
    .exec(function (err, organization) {
      if (err) {
        return next(err);
      } else if (!organization) {
        return next(new Error('Failed to load organization ' + id));
      }
      req.organization = organization;
      return next();
    });
};

/**
 * Organization middleware
 */
exports.organizationByUrlName = function (req, res) {
  Organization.findOne({ urlName: req.params.urlName })
    .populate('panel_models')
    .populate('users', 'displayName organization connections email firstName lastName')
    .populate('possibleUsers', 'displayName organization connections email firstName lastName')
    .populate('admin', 'displayName')
    .populate({ path: 'reviews', match: { verified: true }, options: { sort: { created: -1 } } })
    .populate({ path: 'priceReviews', match: { verified: true }, options: { sort: { quoteDate: -1 } } })
    .exec(function (err, organization) {
      if (err) {
        return res.status(400).json(err);
      } else if (!organization) {
        return res.status(400).json(new Error('Failed to load organization ' + req.params.urlName));
      }

      res.json(organization);
    });
};
