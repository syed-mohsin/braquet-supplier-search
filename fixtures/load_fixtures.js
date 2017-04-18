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

var mg = require('../config/lib/mongoose');
// register modules
mg.loadModels();

var dbUrl = 'mongodb://localhost/mean-dev/?connectTimeoutMS=10000'; //?connectTimeoutMS=3000

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
var promisesClearDataFromDb = require('./panel_fixtures').promisesClearDataFromDb;
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

/*
	*Returns promises that updates orgs after new review fixtures have been generated
*/
var updateOrganizationsAfterReviewsCreation = require('./review_fixtures').updateOrganizations;

/*
	*Returns a promise to clear current price_review models in the Db
*/
var clearPriceReviewData = require('./priceReview_fixtures').clearPriceReviewData;

/*
  *Returns promises that generate mock price review data
*/
var generateMockPriceReviewData = require('./priceReview_fixtures').generateMockPriceReviewData;

/*
  *Returns promises that updates orgs after new price review fixtures have been generated
*/
var updateOrganizationsAfterPriceReviewsCreation = require('./priceReview_fixtures').updateOrganizations;

var currentOrgs = [];
var currentUsers = [];
var promisesToClearData = promisesClearDataFromDb();

Promise.all(promisesToClearData).then(function() {
  console.log('1. Cleared Panels, Orgs, Reviews, and Price Reviews from the db');
  return Promise.all(generateMockPanelData(100));
}).then(function() {
  console.log('2. Generated mock panel data');
  return gatherCurrentPanelData();
}).then(function(currentPanels) {
  console.log('3. Gathered panel data from the db');
  return Promise.all(generateMockOrgData(100, currentPanels));
}).then(function() {
  console.log('4. Generated mock org data');
  return gatherCurrentOrgData();
}).then(function(currOrgs) {
  console.log('5. Gathered org data from the db');
  currentOrgs = currOrgs;
  return gatherCurrentUserData();
}).then(function(currUsers) {
  console.log('6. Gathered user data from the db');
  currentUsers = currUsers;
  return Promise.all(generateMockReviewData(100, currentOrgs, currUsers));
}).then(function() {
  console.log('7. Generated mock review data');
  return gatherCurrentOrgData();
}).then(function(currOrgs) {
  console.log('8. Gathered org data from the db');
  currentOrgs = currOrgs;
  return Promise.all(generateMockPriceReviewData(currentOrgs, currentUsers)); 
}).then(function() {
  console.log('9. Generated mock price review data');
  return Promise.all(updateOrganizationsAfterPriceReviewsCreation(currentOrgs));
}).then(function() {
  console.log('Successfully generated mock data.');
  process.exit(0);
}).catch(function(err) {
  console.log('*** Hit error catch ***');
  console.log(err);
  process.exit(1);
});

