'use strict';

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';

mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});

// register relevant models
require('../modules/organizations/server/models/organization.server.model');
require('../modules/users/server/models/user.server.model');
require('../modules/reviews/server/models/review.server.model');

var Organization = mongoose.model('Organization');
var companyNames = ['Adobe', 'Accenture', 'Aflac', 'Ahlstrom', 'Alltel', 'Blizzard', 'Brooks', 'Bultaco', 'BSNL', 'Brine', 'CAE', 'CDAC', 'Capcom', 'Canon', 'Chello', 'Debian', 'Dixons', 'DuPont', 'Dynergy', 'Dell', 'Ebay', 'ESPN', 'Exxon', 'Evernote', 'Emporis', 'Fazer', 'Fluke', 'Firestone', 'Fiat', 'FAS', 'Garmin', 'Geico', 'Goodyear', 'Gucci', 'Groupn', 'Haribo', 'Harman', 'Hitachi', 'Honeywell', 'Hospira', 'IBM', 'Intel', 'Infosys', 'InBev', 'Ikea', 'Jordan', 'Jasper', 'Jaxon', 'JBL', 'Johnson'];
var industryNames = ['Information Technology', 'Semiconductor', 'Construction', 'Analytics', 'Energy', 'Manufacturing', 'Consulting', 'Public Utility', 'Insurance', 'Public Administration'];
var productTypes = ['Infrastructure', 'Materials', 'Consultancy Services', 'Research and Development', 'Baby Sitting'];

var finalOrgNames = {};

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

	if(!finalOrgNames[profile.companyName]) {
		var organization = new Organization(profile);
		return organization;
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
	// Drop any old organization data in DB
	Organization.remove({}, function(err) { 
		console.log('Organization Collection Removed') 
	})
	.then(function() {
		generateMockOrgData(100);
	})
	.catch(function(err) {
		console.log(err);
	});
};

module.exports = loadNewOrgData;

