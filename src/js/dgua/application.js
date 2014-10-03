"use strict";

var components = require("./components");
var data = require("./data");
var bind = require("./util/bind");
var decorateWith = require("./util/decorate_with");
var _ = require("underscore");


var Application = function(selector, dataPath) {
  this._selector = selector;
  this._dataPath = dataPath;
};

Application.prototype = {

  _nToDisplay: 5,

  init: function() {
    data.Repository.loadDataSources(this._dataPath, bind(this, function(repo) {

      var topDatasets = this._withVisitProportions(
        this._topN(repo.getDatasetsByVisits()),
        repo.getTotalDatasetVisits()
      );
     
      var topPublishers = this._withVisitProportions(
        this._topN(repo.getPublishersByVisits()),
        repo.getTotalPublisherVisits()
      );
     
      var datasetsList = new components.VisitableList(this, topDatasets);
      var publishersList = new components.VisitableList(this, topPublishers);

      var publishersPie = new components.VisitablePie(this, topPublishers);

      var publishersColumn = new components.PublishersColumn(this, publishersPie, publishersList); 
      var publishersDatasets = new components.PublishersDatasets(this, publishersColumn, datasetsList);
      
      publishersDatasets.render(this._selector);
    }));
  },

  _topN: function(collection) {
    return _.first(collection, this._nToDisplay);
  },

  _withVisitProportions: function(collection, totalVisits) {
    return _.map(collection, function(item) {
      return decorateWith(item, {
        visitsProportion: function() {
          return this.visits() / totalVisits;
        } 
      }); 
    }); 
  }
};

module.exports = Application;
