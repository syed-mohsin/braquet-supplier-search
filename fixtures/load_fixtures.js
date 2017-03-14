'use strict';

/*
	* ToDos:
		* No two orgs can have the same name
		* Make sure panels that have same manufacturer do not have same model names 
		* Each org should have a random number of panels
		* Drop the collection before anything new to DB
		* Eventually add script files for each type of mock data generation
*/

/*
	*Load new organization data.
*/
var loadNewOrgData = require('./organization_fixtures');
loadNewOrgData();


/*
	*Load new panel data.
*/
var loadNewPanelData = require('./panel_fixtures');
loadNewPanelData();
