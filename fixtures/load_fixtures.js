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
	*Load new panel data first, then load org data to reinforce associations between panels and orgs
*/
// var loadNewPanelDataPromise = require('./panel_fixtures');

/*
	*Grab the load new org-data promise.
*/
// var loadNewOrgDataPromise = require('./organization_fixtures');

/*
	*Grab the load new review-data promise.
*/
// var loadNewReviewDataPromise = require('./review_fixtures');





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


var p1 = clearPanelsfromDb();
var p2 = generateMockPanelData(); // array of promises
var p3 = clearOrgData();
var p4 = gatherCurrentPanelData();
var p5 = generateMockOrgData(); // array of promises
var p6 = clearReviewData();
var p7 = gatherCurrentOrgData();
var p8 = gatherCurrentUserData();
var p9 = generateMockReviewData(); // array of promises

p1.then(function() {
	console.log('1111111');
	return Promise.all(p2);
}).then(function() {
	console.log('222222');
	return p3;
}).then(function() {
	console.log('33333');
	return p4;
}).then(function() {
	console.log('444444');
	return Promise.all(p5);
}).then(function() {
	console.log('5555555');
	return p6;
}).then(function() {
	console.log('6666666');
	return p7;
}).then(function() {
	console.log('77777777');
	return p8;
}).then(function() {
	console.log('88888888');
	return Promise.all(p9);
}).catch(function(err) {
	console.log(err);
});


//The order is preserved regardless of what resolved first
// Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9])
// 	.then(function(responses) {
// 		console.log(responses);
//   	// responses.map(response => console.log(response));
// 	})
// 	.catch(function(err) {
// 		console.log('************************************************************');
// 		console.log(err);
// 	});






