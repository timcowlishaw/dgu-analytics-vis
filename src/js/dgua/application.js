"use strict";

var components = require("./components");
var data = require("./data");
var bind = require("./util/bind");
var _ = require("underscore");
var ColorKey = require("./util/color_key");
var withVisitProportions = require("./util/with_visit_proportions");

var Application = function(selector, dataPath) {
  this._selector = selector;
  this._dataPath = dataPath;
  this._messageHandlers = {};
};

Application.prototype = {

  _nToDisplay: 5,

  init: function() {
    data.Repository.loadDataSources(this._dataPath, bind(this, function(repo) {

      var topPublishers = withVisitProportions(
        this._topN(repo.getPublishersByVisits()),
        repo.getTotalPublisherVisits()
      );
 
      var topDatasets = withVisitProportions(
        this._topN(repo.getDatasetsByVisits()),
        repo.getTotalDatasetVisits()
      );
   
      var publisherColorKey = new ColorKey(_.map(topPublishers, function(p) { return p.id(); }));

      topPublishers = _.map(topPublishers, function(publisher) {
        return publisherColorKey.withColor(publisher, publisher.id());
      });

      topDatasets = _.map(topDatasets, function(dataset) {
        return publisherColorKey.withColor(dataset, dataset.publisher().id());
      });

      var datasetsList = new components.VisitableList(this, topDatasets);
      var publishersList = new components.VisitableList(this, topPublishers);

      var publishersPie = new components.VisitablePie(this, topPublishers);

      var publishersColumn = new components.PublishersColumn(this, publishersPie, publishersList); 
      var publishersDatasets = new components.PublishersDatasets(this, publishersColumn, datasetsList, publisherColorKey, this._nToDisplay);
      
      publishersDatasets.render(this._selector);
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
