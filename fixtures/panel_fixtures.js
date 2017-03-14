'use strict';

var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/mean-dev';

mongoose.connect(dbUrl, function(err) {
  if (!err) {
    console.log('connected to', dbUrl);
  }
});

// register relevant models
require('../modules/panels/server/models/panelmodel.server.model');
require('../modules/users/server/models/user.server.model');
require('../modules/reviews/server/models/review.server.model');

var manufacturNames = ['Altech', 'Bigtech', 'Jamtech', 'ForceTech', 'Siegeltech', 'FreshTech', 'Niebeltech', 'Ziedletech', 'Yorktech', 'Didliotech'];
var models = ['model1', 'model2', 'model3', 'model4', 'model5'];
var technologyTypes = ['SolarCell1', 'SolarCell2', 'SolarCell3', 'SolarCell4', 'SolarCell5'];

var Panel = mongoose.model('PanelModel');

// Object with key: Manfucturer Name and value: array of models from that manufacturer
var finalPanelManufacturers = {};

var createPanel = function(profile){
	var profile = {};

	profile['manufacturer'] = manufacturNames[Math.floor(Math.random()*manufacturNames.length)] + Math.floor(Math.random()*100).toString();;
	profile['model'] = models[Math.floor(Math.random()*models.length)];
	profile['technologyType'] = technologyTypes[Math.floor(Math.random()*technologyTypes.length)];
	profile['stcModuleEfficiency'] = "20%";
	profile['stcPower'] = Math.floor(Math.random()*500);
	profile['frameColor'] = "Blue";
	profile['numberOfCells'] = Math.floor(Math.random()*50);
	profile['manufacturingLocations'] = [];
	profile['specSheetLink'] = 'Need a Link';

	if(!finalPanelManufacturers[profile.manufacturer]) {
		// If manufacturer hasn't been added before
		var panel = new Panel(profile);
		finalPanelManufacturers[profile.manufacturer] = [profile.model];
		return panel;
	}else {
		// Manufacturer has been added before for this model, need to check if it has same model on its current model array
		// currentModels for the manufacturer
		var currentModels = finalPanelManufacturers[profile.manufacturer];

		if(currentModels.includes(profile.model)){
			// In case Manufacturer already has same model, call createPanel() again
			return createPanel();
		}else {
			// add model to manufacturers array and return a mongoose model
			currentModels.push(profile.model);
			finalPanelManufacturers[profile.manufacturer] = currentModels;
			var panel = new Panel(profile);
			return panel;
		}
	}
}; 

var generateMockPanelData = function(numPanels){
	var mongoosePanels = [];

	for(var i=0; i<numPanels; i++) {
		var panelCreation = createPanel();

		if(panelCreation) {
			mongoosePanels.push(panelCreation);
		}
	}

	var promises = mongoosePanels.map(function(panel) {
		return panel.save();
	});

	Promise.all(promises)
	.then(function(savedPanels) {
		console.log("SAVED ", savedPanels.length, "PANELS");
	})
	.catch(function(err) {
		console.log(err);
	});
};

module.exports = generateMockPanelData;

var loadNewPanelData = function() {
	// Drop any old organization data in DB
	Panel.remove({}, function(err) { 
		console.log('Panel Collection Removed') 
	})
	.then(function() {
		generateMockPanelData(100);
	})
	.catch(function(err) {
		console.log(err);
	});
};

module.exports = loadNewPanelData;
