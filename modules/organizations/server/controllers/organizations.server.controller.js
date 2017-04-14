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
  PriceReview = mongoose.model('PriceReview'),
  PanelModel = mongoose.model('PanelModel'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto'),
  aws = require('aws-sdk'),
  s3 = new aws.S3(),
  _ = require('underscore');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Contact an organization through Braquet Admin
 */
exports.contact = function (req, res) {

  var inquiry = req.body;
  var userDisplayName = req.user.displayName;
  var organizationName = req.organization.companyName;


  Organization.findOne({ _id: req.user.organization })
  .exec()
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
        content: inquiry.content
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
      from: config.mailer.from,
      subject: 'Braquet - Request to Contact a Supplier',
      html: emailHTML
    };

    return new Promise(function(resolve, reject) {
      smtpTransport.sendMail(mailOptions, function (err) {
        if (err) {
          reject(err);
        }
        resolve(mailOptions);
      });
    });
  })
  .then(function(mailOptions) {
    res.json(mailOptions);
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

  // add panel model filter fields
  req.body.panel_models.forEach(function(panel) {
    if (organization.panel_manufacturers.indexOf(panel.manufacturer) === -1) {
      organization.panel_manufacturers.push(panel.manufacturer);
    }

    if (organization.panel_stcPowers.indexOf(panel.stcPower) === -1) {
      organization.panel_stcPowers.push(panel.stcPower);
    }

    if (organization.panel_crystalline_types.indexOf(panel.crystallineType) === -1) {
      organization.panel_crystalline_types.push(panel.crystallineType);
    }

    if (organization.panel_frame_colors.indexOf(panel.frameColor) === -1) {
      organization.panel_frame_colors.push(panel.frameColor);
    }

    if (organization.panel_number_of_cells.indexOf(panel.numberOfCells) === -1) {
      organization.panel_number_of_cells.push(panel.numberOfCells);
    }
  });

  organization.save()
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
    .populate('priceReviews')
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

          // remove unverified price reviews
          organization.priceReviews = organization.priceReviews.filter(function(priceReview) {
            return priceReview.verified === true;
          });

          // remove displayName on anonymous reviews
          organization.reviews.map(function(review) {
            if (review.anonymous && review.user) {
              review.user.displayName = 'anonymous';
              review.user.firstName = 'anonymous';
              review.user.lastName = 'anonymous';
            }

            return review;
          });

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
  organization.productTypes = req.body.productTypes;
  organization.url = req.body.url;
  organization.address1 = req.body.address1;
  organization.address2 = req.body.address2;
  organization.city = req.body.city;
  organization.state = req.body.state;
  organization.zipcode = req.body.zipcode;
  organization.country = req.body.country;
  organization.about = req.body.about;

  // reset panel filtering fields
  organization.panel_manufacturers = [];
  organization.panel_stcPowers = [];
  organization.panel_crystalline_types = [];
  organization.panel_frame_colors = [];
  organization.panel_number_of_cells = [];

  // add panel model filter fields
  req.body.panel_models.forEach(function(panel) {
    if (organization.panel_manufacturers.indexOf(panel.manufacturer) === -1) {
      organization.panel_manufacturers.push(panel.manufacturer);
    }

    if (organization.panel_stcPowers.indexOf(panel.stcPower) === -1) {
      organization.panel_stcPowers.push(panel.stcPower);
    }

    if (organization.panel_crystalline_types.indexOf(panel.crystallineType) === -1) {
      organization.panel_crystalline_types.push(panel.crystallineType);
    }

    if (organization.panel_frame_colors.indexOf(panel.frameColor) === -1) {
      organization.panel_frame_colors.push(panel.frameColor);
    }

    if (organization.panel_number_of_cells.indexOf(panel.numberOfCells) === -1) {
      organization.panel_number_of_cells.push(panel.numberOfCells);
    }
  });

  organization.save()
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
  var result = [];
  var sortObj = { avg_review: -1 }; // by default, sort by avg_review
  var organizationQueryParams = {}; // query object for Organization
  var priceReviewQueryParams = {}; // query object for Price Review
  organizationQueryParams.verified = true; // get only verified organizations
  organizationQueryParams.panels_length = { '$gt': 0 }; // only show suppliers with any panel models

  // check for filtering for manufacturers and/or resellers
  if (req.query.isman === 'true' && req.query.isreseller !== 'true') {
    organizationQueryParams.isManufacturer = true;
  } else if (req.query.isman !=='true' && req.query.isreseller === 'true') {
    organizationQueryParams.isManufacturer = false;
  }

  // build query for search using regular expression
  if (req.query.q) {
    organizationQueryParams.companyName = new RegExp(req.query.q, 'i');
  }

  // build query for manufacturers
  if (req.query.man) {
    var manCondition = req.query.man.split('|').filter(function(m) { return m.length !== 0; });
    organizationQueryParams.panel_manufacturers = { '$in' :  manCondition };
  }

  // build query for crystalline types
  if (req.query.crys) {
    var crysCondition = req.query.crys.split('|').filter(function(c) { return c.length !== 0; });
    organizationQueryParams.panel_crystalline_types = { '$in' :  crysCondition };
  }

  // build query for frame colors
  if (req.query.color) {
    var colorCondition = req.query.color.split('|').filter(function(c) { return c.length !== 0; });
    organizationQueryParams.panel_frame_colors = { '$in' :  colorCondition };
  }

  // build query for number of cells
  if (req.query.cells) {
    var cellsCondition = req.query.cells.split('|').filter(function(m) { return m.length !== 0; });
    organizationQueryParams.panel_number_of_cells = { '$in' :  cellsCondition };
  }

  // build query for wattage filter
  if (req.query.pow) {
    // or statement to check all wattage ranges passed in
    var powerArr = req.query.pow.split('|').filter(function(p) { return p.length !== 0 && !isNaN(p); });
    organizationQueryParams.$or = powerArr.map(function(pow) {
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

  // build query for quantity
  priceReviewQueryParams.quantity = req.query.quantity || '0kW-100kW';


  // for catalog, do a reverse lookup on panels and price reviews
  Organization.find(organizationQueryParams)
  .populate({
    path: 'priceReviews',
    match: priceReviewQueryParams
  })
  .lean() // returns documents as plain JS objects so you can modify them
  .exec()
  .then(function(orgs) {
    // get brands for orgs
    orgs = orgs.map(function(org) {
      // group all price reviews by brand
      org.brands = _.groupBy(org.priceReviews, function(priceReview) {
        return priceReview.manufacturer + '#' + priceReview.panelType;
      });

      // calcuate median of all price reviews under a brand
      org.brands = _.mapObject(org.brands, function(brand) {
        brand.sort(function (a, b) { return a.price - b.price; });
        var lowMiddle = Math.floor((brand.length - 1) / 2);
        var highMiddle = Math.ceil((brand.length - 1) / 2);
        var median = (brand[lowMiddle].price + brand[highMiddle].price) / 2;
        return median;
      });

      // calculate for each type of panel
      var price_sum_mono = 0;
      var price_sum_poly = 0;
      var brands_length_mono = 0;
      var brands_length_poly = 0;
      for (var key in org.brands) {
        if (key.split('#')[1] === 'Mono') {
          price_sum_mono += org.brands[key];
          ++brands_length_mono;
        } else {
          price_sum_poly += org.brands[key];
          ++brands_length_poly;
        }
      }

      // calcuate average for each panel type across brands
      org.brands_avg_mono = price_sum_mono / brands_length_mono;
      org.brands_avg_poly = price_sum_poly / brands_length_poly;
      return org;
    });

    // sort organizations by mono/poly avg and then num reviews
    // build query for crystalline types
    if (req.query.crys &&
        req.query.crys.indexOf('Mono') !== -1 &&
        req.query.crys.indexOf('Poly') === -1) { // sort by mono
      orgs.sort(function(a,b) {
        if(!isFinite(a.brands_avg_mono-b.brands_avg_mono)) {
          return !isFinite(a.brands_avg_mono) ? 1 : -1;
        } else {
          return a.brands_avg_mono - b.brands_avg_mono ||
            a.brands_avg_poly - b.brands_avg_poly ||
            b.reviews_length - a.reviews_length;
        }
      });
    } else { // sort by poly
      orgs.sort(function(a,b) {
        if(!isFinite(a.brands_avg_poly-b.brands_avg_poly)) {
          return !isFinite(a.brands_avg_poly) ? 1 : -1;
        } else {
          return a.brands_avg_poly - b.brands_avg_poly ||
            a.brands_avg_mono - b.brands_avg_mono ||
            b.reviews_length - a.reviews_length;
        }
      });
    }

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
    .populate('priceReviews')
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

          // remove unverified price reviews
          organization.priceReviews = organization.priceReviews.filter(function(priceReview) {
            return priceReview.verified === true;
          });

          // remove displayName on anonymous reviews
          organization.reviews.map(function(review) {
            if (review.anonymous && review.user) {
              review.user.displayName = 'anonymous';
              review.user.firstName = 'anonymous';
              review.user.lastName = 'anonymous';
            }

            return review;
          });

          req.organization = organization;
          return next();
        }
      });
    });
};
