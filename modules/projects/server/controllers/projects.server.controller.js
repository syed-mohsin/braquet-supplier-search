'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Project = mongoose.model('Project'),
  Bid = mongoose.model('Bid'),
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
      var date = new Date(project.bid_deadline);
      var j = schedule.scheduleJob(new Date((new Date()).getTime() + 5000), function() {

        // send notification to all associated with project
        Project.findById(project._id) 
          .exec(function (err, project) {
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
  project.system_capacity = req.body.system_capacity;
  project.bid_deadline = req.body.bid_deadline;
  project.shipping_address = req.body.shipping_address;

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
 * Update a project with a bid
 */
exports.storeBid = function (req, res) {
  var project = req.project;
  var bid = req.bid;
  
  project.bids.push(bid._id);
  project.bidders.push(bid.user);

  project.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // notify project owner that bid was added
      var io = req.app.get('socketio');
      
      // send to all users currently viewing project
      io.emit('refreshProjectView', project._id);

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
  Project.find()
    .sort('bid_deadline')
    .populate('user', 'displayName')
    .populate('bids', null, null, {sort: {'bid_price': 1}})
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
};

/**
 * List of project Bids
 */
exports.projectBids = function (req, res) {
  var project = req.project;

  Bid.find({ _id: { $in : project.bids}})
    .sort('bid_price')
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
    .populate('user', 'displayName')
    .populate('bids', null, null, {sort: {'bid_price': 1}})
    .populate('panel_models', null, null, {sort: {'model': 1}})
    .exec(function (err, project) {
    if (err) {
      return next(err);
    } else if (!project) {
      return res.status(404).send({
        message: 'No project with that identifier has been found'
      });
    } else if (req.user.roles[0] === 'user' && String(req.user._id) !== String(project.user._id)) {
      return res.status(404).send({
        message: 'You are not authorized to access this page'
      });
    }

    // populate bids with users 'deep populate'
    Bid.populate(project.bids, {path: 'user'}, function (err, bids) {
      if (err) {
        return next(err);
      } else if (!bids) {
        return res.status(404).send({
          message: 'Could not load users in bids in project'
        });
      }

      // make project available in controller
      req.project = project;
      next();
    });
  });
};
