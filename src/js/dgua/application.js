"use strict";

var components = require("./components");
var data = require("./data");
var bind = require("./util/bind");
var _ = require("underscore");
var slick = require("slick");

var Application = function(selector) {
  this._selector = selector;
  this._messageHandlers = {};
};

Application.prototype = {

  nToDisplay: 5,

  init: function() {
    this._element = slick.find(this._selector);
    var ds = this._element.dataset;
    var paths = {
      datasetsFilename: ds["dguaDatasetsFilename"],
      publishersFilename: ds["dguaPublishersFilename"],
      mappingFilename: ds["dguaMappingFilename"],
      statsFilename: ds["dguaStatsFilename"],
      countriesFilename: ds["dguaCountriesFilename"],
      referrersFilename: ds["dguaReferrersFilename"]
    };

    data.Repository.loadDataSources(paths, bind(this, function(repo) {
      var dashboard = new components.Dashboard(this, repo);
      var countries = new components.Countries(this, repo);
      var publishersDatasets = new components.PublishersDatasets(this, repo);
      var social = new components.Social(this, repo);
      var platforms = new components.Platforms(this, repo);
      var tabs = new components.TabbedNavigation(this, [
        ["Overview", bind(dashboard, dashboard.render)],
        ["Datasets", bind(publishersDatasets, publishersDatasets.render)],
        ["Countries", bind(countries, countries.render)],
        ["Platforms", bind(platforms, platforms.render)],
        ["Social", bind(social, social.render)] 
      ]);

      tabs.render(this._selector);
      this.registerMessageHandler("switchTab", function(tab) {
        tabs.select(tab);
      });
    }));
  },

  registerMessageHandler: function(messageName, handler) {
    if(!this._messageHandlers[messageName]) {
      this._messageHandlers[messageName] = [];
    }
    this._messageHandlers[messageName].push(handler);
  },

  sendMessage: function() {
    var payload = Array.prototype.slice.apply(arguments);
    var messageName = payload.shift();
    if(this._messageHandlers[messageName]) {
      this._messageHandlers[messageName].forEach(function(h) {
        h.apply(null, payload);
      });
    }
  },

  _topN: function(collection) {
    return _.first(collection, this._nToDisplay);
  }

};

module.exports = Application;
