'use strict';

var mongoose = require('mongoose');
var Panel = mongoose.model('PanelModel');
var Organization = mongoose.model('Organization');
var Review = mongoose.model('Review');
var PriceReview = mongoose.model('PriceReview');

var manufacturNames = ['Altech', 'Bigtech', 'Jamtech', 'ForceTech', 'Siegeltech', 'FreshTech', 'Niebeltech', 'Ziedletech', 'Yorktech', 'Didliotech'];
var models = ['model1', 'model2', 'model3', 'model4', 'model5'];
var technologyTypes = ['SolarCell1', 'SolarCell2', 'SolarCell3', 'SolarCell4', 'SolarCell5'];
var panelTypes = ['Poly', 'Mono'];


// Object with key: Manfucturer Name and value: array of models from that manufacturer
var finalPanelManufacturers = {};

var createPanel = function(profile){
  var profile = {};

  profile['manufacturer'] = manufacturNames[Math.floor(Math.random()*manufacturNames.length)] + Math.floor(Math.random()*100).toString();;
  profile['model'] = models[Math.floor(Math.random()*models.length)];
  profile['technologyType'] = technologyTypes[Math.floor(Math.random()*technologyTypes.length)];
  profile['stcModuleEfficiency'] = "20%";
  profile['crystallineType'] = panelTypes[Math.floor(Math.random()*panelTypes.length)];
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
  } else {
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
  var panels = [];

  for(var i=0; i<numPanels; i++) {
    var panelCreation = createPanel();

    if(panelCreation) {
  	  panels.push(panelCreation);
    }
  }

  return panels.map(function(panel) {
    return panel.save();
  });

  return promises;
};

var clearAllDataFromDb = function() {
  return [Panel.remove({}).exec(), Organization.remove({}).exec(), Review.remove({}).exec(), PriceReview.remove({}).exec()];
};

module.exports = {
  'generateMockPanelData': generateMockPanelData,
  'promisesClearDataFromDb': clearAllDataFromDb
};

