'use strict';

/*
	* Currently:
		* No two orgs can have the same name
		* Panels that have the same manufacturer do not have the same model names 
		* Each org should have a random number of panels
*/
/*
	Associations Currently:
		* load order -> panels made before orgs
		* panels need to be associated with orgs
		* pick a random assortment of panels from the db and associate them with orgs

*/

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';

// Update to ES6 Promises
mongoose.Promise = global.Promise;

// register relevant models
require('../modules/panels/server/models/panelmodel.server.model');
require('../modules/users/server/models/user.server.model');
require('../modules/reviews/server/models/review.server.model');
require('../modules/organizations/server/models/organization.server.model');


mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});


/*
	*Returns a promise to clear current panel models in the Db
*/
var clearPanelsfromDb = require('./panel_fixtures').clearPanelsfromDb;

/*
	*Returns promises that generate mock panel data
*/
var generateMockPanelData = require('./panel_fixtures').generateMockPanelData;

/*
	*Returns a promise to clear current org models in the Db
*/
var clearOrgData = require('./organization_fixtures').clearOrgData;

/*
	*Returns a promise to gather all panels currently in the Db
*/
var gatherCurrentPanelData = require('./organization_fixtures').gatherCurrentPanelData;

/*
	*Returns promises that generate mock org data
*/
var generateMockOrgData = require('./organization_fixtures').generateMockOrgData;

/*
	*Returns a promise to clear current review models in the Db
*/
var clearReviewData = require('./review_fixtures').clearReviewData;

/*
	*Returns a promise to gather all orgs currently in the Db
*/
var gatherCurrentOrgData = require('./review_fixtures').gatherCurrentOrgData;

/*
	*Returns a promise to gather all users currently in the Db
*/
var gatherCurrentUserData = require('./review_fixtures').gatherCurrentUserData;

/*
	*Returns promises that generate mock review data
*/
var generateMockReviewData = require('./review_fixtures').generateMockReviewData;

var currentOrgs = [];
var promiseClearPanelsFromDb = clearPanelsfromDb();

promiseClearPanelsFromDb.then(function() {
	return Promise.all(generateMockPanelData(100));
}).then(function() {
	return clearOrgData();
}).then(function() {
	return gatherCurrentPanelData();
}).then(function(currentPanels) {
	return Promise.all(generateMockOrgData(100, currentPanels));
}).then(function() {
	return clearReviewData();
}).then(function() {
	return gatherCurrentOrgData();
}).then(function(currOrgs) {
	currentOrgs = currOrgs;
	return gatherCurrentUserData();
}).then(function(currUsers) {
	return Promise.all(generateMockReviewData(100, currentOrgs, currUsers));
}).catch(function(err) {
	console.log(err);
});
