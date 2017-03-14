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

// register relevant models
require('../modules/panels/server/models/panelmodel.server.model');
require('../modules/users/server/models/user.server.model');
require('../modules/reviews/server/models/review.server.model');
require('../modules/organizations/server/models/organization.server.model');

/*
	*Grab the load new org-data promise.
*/
var loadNewOrgData = require('./organization_fixtures');

/*
	*Load new panel data first, then load org data to reinforce associations between panels and orgs
*/
var loadNewPanelDataPromise = require('./panel_fixtures');
loadNewPanelDataPromise.then(function() {
	loadNewOrgData();
}).catch(function(err) {
	console.log(err);
});
