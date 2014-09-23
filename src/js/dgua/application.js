"use strict";

var components = require("./components");
var data = require("./data");
var bind = require("./util/bind");
var _ = require("underscore");

var Application = function(selector, dataPath) {
  this._selector = selector;
  this._dataPath = dataPath;
};

Application.prototype = {
  init: function() {
    data.Repository.loadDataSources(this._dataPath, bind(this, function(repo) {
      console.log(repo.getPublishersByVisits().slice(0, 3));
      console.log(repo.getDatasetsByVisits().slice(0, 3));
      console.log(_.map(repo.getDatasetsByVisits().slice(0, 3), function(d) { return d.publisher(); } ));
      console.log(repo.getPublishersByVisits()[0].datasets().slice(0, 3));
      var publishersColumn = new components.PublishersColumn();
      var datasetsColumn = new components.DatasetsColumn();
      var publishersDatasets = new components.PublishersDatasets(publishersColumn, datasetsColumn);
      publishersDatasets.render(this._selector);
    }));
  }
};

module.exports = Application;
