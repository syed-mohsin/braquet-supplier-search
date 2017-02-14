'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  Bid = mongoose.model('Bid'),
  User = mongoose.model('User'),
  schedule = require('node-schedule'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a project
 */
exports.create = function (req, res) {
  var project = new Project(req.body);
  project.user = req.user;

  project.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // notify project owner that bid was added
      var io = req.app.get('socketio');

      // get array of user sockets
      var sockets = req.app.get('socket-users');
      
      // send notification to project bidders on list page
      io.emit('refreshProjectList', project.user._id);

      // set a listener for bid deadline
      var deadline = new Date(project.bid_deadline);
      var j = schedule.scheduleJob(deadline, function() {

        // send notification to all associated with project
        Project.findById(project._id, function (err, project) {
          if (err) {
            console.log("err");
          }
          console.log('bid has ended!');
          // get recipients [bidders+project_owner+(eventually, connections)]
          var recipients = project.bidders.concat([project.user]); // project.user=id
          
          // send to all recipients
          recipients.forEach(function(recipient) {

            if (recipient in sockets) {
              var socket_ids = sockets[recipient];
              console.log(socket_ids);
              // send to each open socket open for user
              socket_ids.forEach(function(socket_id) {
                io.to(socket_id).emit("bidDeadlineList", project._id);
                console.log("sent to : " + socket_id);
              });
            }
          });

        });
      });

      res.json(project);
    }
  });
};

/**
 * Show the current project
 */
exports.read = function (req, res) {
  res.json(req.project);
};

/**
 * Update a project
 */
exports.update = function (req, res) {
  var project = req.project;

  project.title = req.body.title;
  project.panel_models = req.body.panel_models;
  project.quantity = req.body.quantity;
  project.bid_deadline = req.body.bid_deadline;
  project.shipping_address_1 = req.body.shipping_address_1;
  project.shipping_address_2 = req.body.shipping_address_2;
  project.shipping_address_city = req.body.shipping_address_city;
  project.shipping_address_state = req.body.shipping_address_state;
  project.shipping_address_zip_code = req.body.shipping_address_zip_code;
  project.shipping_address_country = req.body.shipping_address_country;
  project.preferred_payment_term = req.body.preferred_payment_term;

  project.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(project);
    }
  });
};

/**
 * Delete a project
 */
exports.delete = function (req, res) {
  var project = req.project;

  project.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // notify project owner that bid was added
      var io = req.app.get('socketio');
      
      // send notification to project bidders on list page
      io.emit('refreshProjectList', 'refresh');

      // send notification to bid list view to refresh
      io.emit('refreshBidList', 'refresh');

      res.json(project);
    }
  });
};

/**
 * List of Projects
 */
exports.list = function (req, res) {
  if (req.user.roles.indexOf('user') !== -1) {
    Project.find({user : req.user._id})
      .sort('bid_deadline')
      .populate('user', 'displayName')
      .populate('bids', null, null, {sort: {'subtotal': 1}})
      .populate('panel_models', null, null, {sort: {'manufacturer' : 1}})
      .exec(function (err, projects) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        // populate bids with users 'deep populate'
        Bid.populate(projects, {path: 'bids.user', model: 'User'}, function (err, bids) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          // return deep populated projects
          res.json(projects);
        });
      }
    });
  } else { // for sellers, find public projects or one's they have been invited to
    Project.find({ $or : [{bidders: req.user._id}, {project_state: 'public'}]})
      .sort('bid_deadline')
      .populate('user', 'displayName')
      .populate('bids', null, null, {sort: {'subtotal': 1}})
      .populate('panel_models', null, null, {sort: {'manufacturer' : 1}})
      .exec(function (err, projects) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        // populate bids with users 'deep populate'
        Bid.populate(projects, {path: 'bids.user', model: 'User'}, function (err, bids) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          // return deep populated projects
          res.json(projects);
        });
      }
    });
  }

};

exports.inviteBidders = function(req, res) {
  var project = req.project;
  project.bidders = project.bidders.concat(req.body);

  project.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(project);
    }
  }); 
};

/**
 * List of project Bids
 */
exports.projectBids = function (req, res) {
  var project = req.project;

  Bid.find({ _id: { $in : project.bids}})
    .sort('subtotal')
    .populate('user', 'displayName')
    .exec(function (err, bids) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(bids);
    }
  });
};

/**
 * Project middleware
 */
exports.projectByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Project is invalid'
    });
  }

  Project.findById(id)
    .populate('user', 'displayName connections')
    .populate('bids', null, null, {sort: {'subtotal': 1}})
    .populate('bidders')
    .populate('panel_models', null, null, {sort: {'model': 1}})
    .exec(function (err, project) {
    if (err) {
      return next(err);
    } else if (!project) {
      return res.status(404).send({
        message: 'No project with that identifier has been found'
      });
    } else if (req.user && req.user.roles[0] === 'user' && String(req.user._id) !== String(project.user._id)) {
      return res.status(404).send({
        message: 'You are not authorized to access this page'
      });
    }

    // populate bids with users 'deep populate'
    Bid.populate(project.bids, [
      {path: 'organization'},
      {path: 'user',
        select: "-password -salt -roles -connections -received_user_invites -sent_user_invites"}
      ], function (err, bids) {
      if (err) {
        return next(err);
      } else if (!bids) {
        return res.status(404).send({
          message: 'Could not load users in bids in project'
        });
      }

      // extract ids from bidder objects
      var bidder_ids = project.bidders.map(function(bidder) {
        return bidder._id;
      });

      // populate connections we want to add
      User.populate(project.user, 
        {path: 'connections', 
          match: { _id: { $nin: bidder_ids }, roles: 'seller' },
          select: "-password -salt -roles -connections -received_user_invites -sent_user_invites"}, function(err, connections) {
        if (err) {
          return next(err);
        } else if (!connections) {
          return res.status(404).send({
            message: 'Could not load User\'s connections'
          });
        }

        // remove un-owned bids if current user is a supplier/seller
        if (req.user && req.user.roles.indexOf('seller') !== -1) {
          project.bids = project.bids.filter(function(bid) {
            return req.user._id.equals(bid.user._id);
          }); 
        }
        
        // make project available in controller
        req.project = project;
        next();
      }); // end User.populate
    }); // end Bid.populate
  });
};
