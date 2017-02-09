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
 * Update org logo
 */
exports.uploadPhoto = function (req, res) {
  var message = null;
  var upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'braquetpanelphotos',
      acl: 'public-read',
      metadata: function(req, file, cb) {
        console.log(file);
        cb(null, file);
      }
    })
  }).single('newLogo');

  var photoUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;
  
  // Filtering to upload only images
  upload.fileFilter = photoUploadFileFilter;

  PanelModel.findById(req.params.panelId, function(err, panel) {
    upload(req, res, function (uploadError) {
      if(uploadError) {
        return res.status(400).json(uploadError);
      } else {
        panel.panelPhotoUrl = req.file.location;

        panel.save(function (saveError) {
          if (saveError) {
            return res.status(400).json(saveError);
          } else {
            res.json(panel);
          }
        });
      }
    });
  });
};
