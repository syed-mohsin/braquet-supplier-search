'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  PanelModel = mongoose.model('PanelModel'),
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