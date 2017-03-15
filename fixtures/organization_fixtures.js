'use strict';

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';

mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});

var Organization = mongoose.model('Organization');
var Panel = mongoose.model('PanelModel');
var companyNames = ['Adobe', 'Accenture', 'Aflac', 'Ahlstrom', 'Alltel', 'Blizzard', 'Brooks', 'Bultaco', 'BSNL', 'Brine', 'CAE', 'CDAC', 'Capcom', 'Canon', 'Chello', 'Debian', 'Dixons', 'DuPont', 'Dynergy', 'Dell', 'Ebay', 'ESPN', 'Exxon', 'Evernote', 'Emporis', 'Fazer', 'Fluke', 'Firestone', 'Fiat', 'FAS', 'Garmin', 'Geico', 'Goodyear', 'Gucci', 'Groupn', 'Haribo', 'Harman', 'Hitachi', 'Honeywell', 'Hospira', 'IBM', 'Intel', 'Infosys', 'InBev', 'Ikea', 'Jordan', 'Jasper', 'Jaxon', 'JBL', 'Johnson'];
var industryNames = ['Information Technology', 'Semiconductor', 'Construction', 'Analytics', 'Energy', 'Manufacturing', 'Consulting', 'Public Utility', 'Insurance', 'Public Administration'];
var productTypes = ['Infrastructure', 'Materials', 'Consultancy Services', 'Research and Development', 'Baby Sitting'];

//Range values used to determine the random number of panels associated with each org
var panelMin = 15;
var panelMax = 100;

//Panels that currently exist in DB
var currentPanels;

var finalOrgNames = {};

var populatePanelModel = function(profile) {
	var randomNumberPanels = Math.floor(Math.random() * (panelMax - panelMin)) + panelMin;

	for(var i=0; i<randomNumberPanels; i++) {
		var randomIndex = Math.floor(Math.random() * (currentPanels.length - 1));
		profile.panel_models.push(currentPanels[randomIndex]._id);
		profile.panel_manufacturers.push(currentPanels[randomIndex].manufacturer);
		profile.panel_stcPowers.push(currentPanels[randomIndex].stcPower);
	}

	return profile;
};

var createOrganization = function() {
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
	profile['panel_manufacturers'] = [];
	profile['panel_stcPowers'] = [];


	if(!finalOrgNames[profile.companyName]) {
		var updatedProfile = populatePanelModel(profile);
		// var organization = new Organization(updatedProfile);
		return new Organization(updatedProfile);
	} else{
		return createOrganization();
	}
};

var generateMockOrgData = function(numOrgs) {

	var mongooseOrgs = [];

	for(var i=0; i<numOrgs; i++) {
		var orgCreation = createOrganization();

		if(orgCreation) {
			mongooseOrgs.push(orgCreation);
		}
	}

	var promises = mongooseOrgs.map(function(org) {
		return org.save();
	});

	Promise.all(promises)
	.then(function(savedOrgs) {
		console.log("SAVED ", savedOrgs.length, "ORGS");
	})
	.catch(function(err) {
		console.log(err);
	});
};

var loadNewOrgData = function() {
	
	Organization.remove({}, function(err) {
		// Drop any old organization data in DB 
		console.log('Organization Collection Removed');
	})
	.then(function() {
		//Fetch all panels in DB
		return Panel.find().exec();
	})
	.then(function(panelsInDB) {
		//Populate currentPanels global array
		currentPanels = panelsInDB;
	})
	.then(function() {
		//Generate mock org data; send in the number of orgs to be generated
		generateMockOrgData(100);
	})
	.catch(function(err) {
		console.log(err);
	});
};

module.exports = loadNewOrgData;
