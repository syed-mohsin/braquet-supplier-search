'use strict';

/*
	* No two orgs can have the same name
	* Make sure panels that have same manufacturer do not have same model names 
	* Each org should have a random number of panels
	* Drop the collection before anything new to DB
*/

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';

mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});

// register relevant models
require('../modules/organizations/server/models/organization.server.model');
require('../modules/panels/server/models/panelmodel.server.model');
require('../modules/users/server/models/user.server.model');
require('../modules/reviews/server/models/review.server.model');



var Organization = mongoose.model('Organization');

// Organization.find()
//   .exec()
//   .then(function(orgs) {
//     console.log(orgs.length);
//   });


var companyNames = ['Adobe', 'Accenture', 'Aflac', 'Ahlstrom', 'Alltel', 'Blizzard', 'Brooks', 'Bultaco', 'BSNL', 'Brine', 'CAE', 'CDAC', 'Capcom', 'Canon', 'Chello', 'Debian', 'Dixons', 'DuPont', 'Dynergy', 'Dell', 'Ebay', 'ESPN', 'Exxon', 'Evernote', 'Emporis', 'Fazer', 'Fluke', 'Firestone', 'Fiat', 'FAS', 'Garmin', 'Geico', 'Goodyear', 'Gucci', 'Groupn', 'Haribo', 'Harman', 'Hitachi', 'Honeywell', 'Hospira', 'IBM', 'Intel', 'Infosys', 'InBev', 'Ikea', 'Jordan', 'Jasper', 'Jaxon', 'JBL', 'Johnson'];
var industryNames = ['Information Technology', 'Semiconductor', 'Construction', 'Analytics', 'Energy', 'Manufacturing', 'Consulting', 'Public Utility', 'Insurance', 'Public Administration'];
var productTypes = ['Infrastructure', 'Materials', 'Consultancy Services', 'Research and Development', 'Baby Sitting'];

var finalOrgNames = {};

var createOrganization = function(profile){

	if(!finalOrgNames[profile.companyName]) {
		var organization = new Organization(profile);

		return new Promise(resolve,reject) {
			organization.save(function(err, savedProfile) {
			    if (err) {
			    	console.log('error making org: ', err);
			    	reject(err);
			    } else {
			    	console.log('successfully created org: ', savedProfile);
			    	finalOrgNames[savedProfile.companyName] = true;
			    	resolve(savedProfile);
			    }	
			})
			
  		});
	}else {
		console.log('Organization name already exists!');
	}
};

var generateMockOrgData = function(){
	var prePromises = [];

	for(var i=0; i<100; i++) {

		var profile = {};

		profile['verified'] = true;
		profile['users'] = [];
		profile['possibleUsers'] = [];
		profile['companyName'] = companyNames[Math.floor(Math.random()*companyNames.length)] + Math.floor(Math.random()*100).toString();
		profile['reviews'] = [];
		profile['avg_review'] = Math.floor(Math.random()*100);
		profile['panel_models'] = [];
		profile['industry'] = industryNames[Math.floor(Math.random()*industryNames.length)];
		profile['productTypes'] = productTypes[Math.floor(Math.random()*productTypes.length)];
		profile['url'] = 'www.' + profile['companyName'] + '.com';
		profile['address1'] = '329 12th Street';
		profile['address2'] = '329 12th Street';
		profile['city'] = 'San Francisco';
		profile['state'] = 'California';
		profile['zipcode'] = '94117';
		profile['country'] = 'USA';
		profile['about'] = 'We love solar';

		var createdOrg = new Promise((resolve, reject) => {
			createOrganization(profile);
	    });

		prePromises.push(createdOrg);
	}

	var promise = Promise.all(prePromises);

	promise.then(function(returnedArr) {
		console.log('HIT HERE!!');
	})
	.catch(function(err) {
		console.log('Organization Creation: ', err);
	});

};

generateMockOrgData();




/*


var manufacturNames = ['Altech', 'Bigtech', 'Jamtech', 'ForceTech', 'Siegeltech', 'FreshTech', 'Niebeltech', 'Ziedletech', 'Yorktech', 'Didliotech'];
var models = ['model1', 'model2', 'model3', 'model4', 'model5'];
var technologyTypes = ['SolarCell1', 'SolarCell2', 'SolarCell3', 'SolarCell4', 'SolarCell5'];

var Panel = mongoose.model('PanelModel');

// Object with key: Manfucturer Name and value: array of models from that manufacturer
var finalPanelManufacturers = {};


var createPanel = function(profile){

	if(!finalPanelManufacturers[profile.manufacturer]) {
		var panel = new Panel(profile);

		panel.save(function(err, savedProfile) {
			if (err) {
		    	console.log('error making panel: ', err);
		    } else {
		    	console.log('successfully created panel');
		    	finalPanelManufacturers[savedProfile.manufacturer] = [savedProfile.model];
		    }
		});
	}else {
		// currentModels for the manufacturer
		var currentModels = finalPanelManufacturers[profile.manufacturer];

		if(currentModels.includes(profile.model)){
			console.log('Manufacturer already has model ', profile.model);
		}else {
			currentModels.push(profile.model);
			finalPanelManufacturers[profile.manufacturer] = currentModels;

			var panel = new Panel(profile);

			panel.save(function(err, savedProfile) {
				if (err) {
			    	console.log('error making panel: ', err);
			    } else {
			    	console.log('successfully created panel');
			    }
			});
		}
	}
};

// Make sure panels that have same manufacturer do not have same model names 

var generateMockPanelData = function(){

	var prePromises = [];

	for(var i=0; i<100; i++) {

		var profile = {};

		profile['manufacturer'] = manufacturNames[Math.floor(Math.random()*manufacturNames.length)] + Math.floor(Math.random()*100).toString();;
		profile['model'] = models[Math.floor(Math.random()*models.length)];
		profile['technologyType'] = technologyTypes[Math.floor(Math.random()*technologyTypes.length)];
		profile['stcModuleEfficiency'] = "20%";
		profile['stcPowerW'] = Math.floor(Math.random()*500);
		profile['frameColor'] = "Blue";
		profile['numberOfCells'] = Math.floor(Math.random()*50);
		profile['manufacturingLocations'] = [];
		profile['specSheetLink'] = 'Need a Link';


		var createdPanel = new Promise((resolve, reject) => {
			createPanel(profile);
	    });

		prePromises.push(createdPanel);
	}

	var promise = Promise.all(prePromises);

	promise.then(function(returnedArr) {
		console.log('HIT HERE!!**********************************');
	})
	.catch(function(err) {
		console.log('Panel Creation: ', err);
	});

};

generateMockPanelData();

*/

