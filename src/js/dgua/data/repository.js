"use strict";

var d3 = require("d3-browserify");
var bind = require("../util/bind");
var promises = require("../util/promises");
var _ = require("underscore");
var models = require("../models");
var Heap = require("heap");

var Repository = function(basePath) {
  this._basePath = basePath;
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

  loadSources: function(callback) {
    var loadDatasets = this._loadCsvPromise(this._datasetsFilename);
    var loadPublishers = this._loadCsvPromise(this._publishersFilename);
    var loadMapping = this._loadCsvPromise(this._mappingFilename);
    promises.fanIn([loadDatasets, loadPublishers, loadMapping], bind(this, function(responses) {
      _.each(responses[2], bind(this, this._loadMapping));
      _.each(responses[1], bind(this, this._loadPublisher));
      _.each(responses[0], bind(this, this._loadDataset));
      callback();
    }));
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

  _loadDataset: function(data, mapping) { 
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
