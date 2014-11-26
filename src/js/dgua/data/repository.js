"use strict";

var d3 = require("d3-browserify");
var bind = require("../util/bind");
var Promise = require("bluebird");
var promises = require("../util/promises");
var _ = require("underscore");
var models = require("../models");
var Heap = require("heap");

var Repository = function(basePath) {
  this._basePath = basePath;
  this._statisticsByName = {};
  this._countriesByName = {};
  this._datasetsById = {};
  this._datasetsByPublisher = {};
  this._datasetsByVisits = new Heap(function(a, b) {
    return b.visits() - a.visits(); 
  });
  this._publishersById = {};
  this._publishersByVisits = new Heap(function(a, b) {
    return b.visits() - a.visits(); 
  });
  this._datasetPublisherIdsMapping = {};
};

Repository.prototype = {
  
  _datasetsFilename:  "datasets_all_all.csv",
  _publishersFilename: "publishers_all.csv",
  _mappingFilename: "datasets_publishers_mapping.csv",
  _statsFilename: "stats_all.csv",
  _countriesFilename: "country_latlngs.csv",

  loadSources: function(callback) {
    var loadDatasets = this._loadCsvPromise(this._datasetsFilename);
    var loadPublishers = this._loadCsvPromise(this._publishersFilename);
    var loadMapping = this._loadCsvPromise(this._mappingFilename);
    var loadStats = this._loadCsvPromise(this._statsFilename);
    var loadCountries = this._loadCsvPromise(this._countriesFilename);
    promises.fanIn([loadDatasets, loadPublishers, loadMapping, loadStats, loadCountries], bind(this, function(responses) {
      _.each(responses[4], bind(this, this._loadCountry));
      _.each(responses[3], bind(this, this._loadStat));
      _.each(responses[2], bind(this, this._loadMapping));
      _.each(responses[1], bind(this, this._loadPublisher));
      _.each(responses[0], bind(this, this._loadDataset));
      callback(this);
    }));
  },

  getStatistic: function(name) {
    return this._statisticsByName[name];
  },

  getCountry: function(name) {
    return this._countriesByName[name];
  },

  getTotalDatasetVisits: function() {
    return _.reduce(this.getDatasetsByVisits(), function(t, ds) { return t + ds.visits(); }, 0);
  },

  getTotalPublisherVisits: function() {
    return _.reduce(this.getPublishersByVisits(), function(t, p) { return t + p.visits(); }, 0);
  },
  
  getDatasetById: function(id)  {
    return this._datasetsById[id];
  },

  getPublisherById: function(id) {
    return this._publishersById[id];
  },

  getDatasetsByVisits: function() {
    return this._datasetsByVisits.toArray(); 
  },

  getPublishersByVisits: function() {
    return this._publishersByVisits.toArray(); 
  },

  _getDatasetsForPublisher: function(publisher) {
    var datasets = this._datasetsByPublisher[publisher.id()];
    if(datasets) {
      return datasets.toArray(); 
    }
  },

  _getPublisherForDataset: function(dataset) {
    var id = this._datasetPublisherIdsMapping[dataset.id()];
    if(id) {
      return this.getPublisherById(id);
    }
  },

  _loadMapping: function(mapping) {
    this._datasetPublisherIdsMapping[mapping["Dataset Name"]] = mapping["Publisher Name"];
  },

  _loadDataset: function(data) { 
    var dataset = new models.Dataset(data, bind(this, this._getPublisherForDataset));
    var id = dataset.id();
    if(dataset.publisher()) {
      this._datasetsByPublisher[dataset.publisher().id()].push(dataset);
    }
    this._datasetsByVisits.push(dataset);
    this._datasetsById[id] = dataset;
  },

  _loadPublisher: function(data) { 
    var publisher = new models.Publisher(data, bind(this, this._getDatasetsForPublisher));
    var id = publisher.id();
    this._publishersByVisits.push(publisher);
    this._datasetsByPublisher[id] = new Heap(function(a, b) {
      return b.visits() - a.visits(); 
    });
    this._publishersById[id] = publisher;
  },

  _loadStat: function(data) {
    var name = data["Statistic"];
    var key = data["Key"];
    var period = data["Period"];
    var value = data["Value"]; 
    var stat = new models.Statistic(period, value);
    if(!this._statisticsByName[name]) this._statisticsByName[name] = new models.Group();
    var group = this._statisticsByName[name];

    if(!group.series(key)) group.add(key,  new models.Series());
    var series = group.series(key);

    series.add(stat);
  },

  _loadCountry: function(data) {
    var country = new models.Country(data);
    this._countriesByName[country.name()] = country;
  },

  _loadCsvPromise: function(url) {
    return new Promise(bind(this, function(resolve, reject) {
      d3.csv(this._basePath + url, function(error, response) {
        if(error) {
          reject(error);
         } else {
          resolve(response);
         }
      });
    }));
  }
};

Repository.loadDataSources = function(dataPath, callback) {
  var repo = new Repository(dataPath);
  repo.loadSources(function() {
    callback(repo);
  });
};

module.exports = Repository;
