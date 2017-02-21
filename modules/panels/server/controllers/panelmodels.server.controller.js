'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  PanelModel = mongoose.model('PanelModel'),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  aws = require('aws-sdk'),
  s3 = new aws.S3(),

  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Return a json array of panel models based on name
 */
exports.searchByName = function (req, res) {
  PanelModel.find().exec(function (err, panelmodels) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // return json array of panelmodels
      res.json(panelmodels);
    }
  });
};

/**
 * Show the current panel model
 */
exports.read = function (req, res) {
  res.json(req.panelmodel);
};

  /**
 * Update org logo
 */
exports.uploadPhoto = function (req, res) {
  var message = null;
  var upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'braquetpanelmodelphotos',
      acl: 'public-read',
      metadata: function(req, file, cb) {
        console.log(file);
        cb(null, file);
      }
    })
  }).single('newPanelModelPhoto');

  var photoUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = photoUploadFileFilter;

  PanelModel.findById(req.params.panelId, function(err, panel) {
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).json(uploadError);
      } else {
        var oldImageKey = panel.panelPhotoUrl.split('/').pop();
        panel.panelPhotoUrl = req.file.location;

        panel.save(function (saveError) {
          if (saveError) {
            return res.status(400).json(saveError);
          } else {
            s3.deleteObject({ Bucket: 'braquetpanelmodelphotos', Key: oldImageKey }, function(err, data) {
              if (err) {
                return res.status(400).json(err);
              } else {
                res.json(panel);
              }
            });
          }
        });
      }
    });
  });
};

/**
 * PanelModel middleware
 */
exports.panelmodelByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'PanelModel is invalid'
    });
  }

  PanelModel.findById(id, function (err, panelmodel) {
    if (err) {
      return next(err);
    } else if (!panelmodel) {
      return next(new Error('Failed to load panelmodels ' + id));
    }

    req.panelmodel = panelmodel;
    next();
  });
};
