'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mg = require('../config/lib/mongoose'),
  quotes = require('./priceReviewDump.json');

// mongoose.connect(process.env.MONGO_PRODUCTION_CONNECTION_URL);
mongoose.connect('mongodb://localhost/mean-dev');

// register modules
mg.loadModels();

var PanelModel = mongoose.model('PanelModel'),
  Organization = mongoose.model('Organization'),
  PriceReview = mongoose.model('PriceReview'),
  User = mongoose.model('User');

var adminUser;
User.findOne({ email: 'syedm.90@gmail.com' })
.exec()
.then(function(user) {
  if (!user) {
    throw 'invalid user!';
  }
  adminUser = user;

  return Promise.all(quotes.map(function(quote) {
    return Organization.findOne({ companyName: quote.seller }).exec();
  }));
})
.then(function(organizations) {
  var missingOrgs = [];

  organizations.forEach(function(org, i) {
    if (!org) {
      missingOrgs.push(quotes[i].seller);
    }
  });

  missingOrgs = Array.from(new Set(missingOrgs));

  if (missingOrgs.length) {
    throw 'missing organizations: ' + missingOrgs.join(', ');
  }

  var promises = quotes.map(function(quote, i) {
    var obj = {};
    obj.quoteDate = new Date(quote.quoteDate);
    obj.deliveryDate = new Date(quote.deliveryDate);
    obj.stcPower = quote.wattage;
    obj.manufacturer = quote.manufacturer;
    obj.price = quote.price * 100;
    obj.quantity = quote.quantity.trim();
    obj.panelType = ['Mono', 'Poly'].indexOf(quote.panelType) !== -1 ? quote.panelType : 'other';
    obj.includesShipping = quote.includesShipping === 'Y' ? true : false;
    obj.shippingLocation = quote.includesShipping === 'Y' ? quote.shippingLocation : undefined;
    obj.user = adminUser._id;
    obj.organization = organizations[i]._id;

    var priceReview = new PriceReview(obj);

    return priceReview.save();
  });

  return Promise.all(promises);
})
.then(function(savedPriceReviews) {
  console.log('successfully uploaded', savedPriceReviews.length, 'quotes');
  process.exit(0);
})
.catch(function(err) {
  console.log(err);
  process.exit(1);
})
