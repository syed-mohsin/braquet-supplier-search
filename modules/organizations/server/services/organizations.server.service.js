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

exports.cachePanelFields = function(organization, panelModels) {
  // reset panel filtering fields
  organization.panel_manufacturers = [];
  organization.panel_stcPowers = [];
  organization.panel_crystalline_types = [];
  organization.panel_frame_colors = [];
  organization.panel_number_of_cells = [];

  // add panel model filter fields
  panelModels.forEach(function(panel) {
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

  return organization;
};
