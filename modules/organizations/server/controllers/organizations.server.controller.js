'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  Organization = mongoose.model('Organization'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

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
 * Organization middleware
 */
exports.organizationByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Organization is invalid'
    });
  }

  Organization.findById(id, function (err, organization) {
    if (err) {
      return next(err);
    } else if (!organization) {
      return next(new Error('Failed to load organization ' + id));
    } 

    req.organization = organization;
    next();
  });
};
