"use strict";

var render = require("../util/render");
var fs = require("fs");
var _ = require("underscore");
var bind = require("../util/bind");
var VisitableList = require("../components/visitable_list");
var VisitablePie = require("../components/visitable_pie");
var PublishersColumn = require("../components/publishers_column");
var ColorKey = require("../util/color_key");
var withVisitProportions = require("../util/with_visit_proportions");

var PublishersDatasets = function(app, repo) {
  this._app = app;
  this._repo = repo;
 
  this._app.registerMessageHandler("selectPublisher", bind(this, this._onSelectPublisher));
};

PublishersDatasets.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/publishers_datasets.mustache", "utf8"),

  _publishersColumnSelector: ".publishers",
  _datasetsColumnSelector: ".datasets",

  render: function(selector) {
    var topPublishers = withVisitProportions(
      this._topN(this._repo.getPublishersByVisits()),
      this._repo.getTotalPublisherVisits()
    );

    var topDatasets = withVisitProportions(
      this._topN(this._repo.getDatasetsByVisits()),
      this._repo.getTotalDatasetVisits()
    );

    this._publisherColorKey = new ColorKey(_.map(topPublishers, function(p) { return p.id(); }));

    
    topPublishers = _.map(topPublishers, bind(this, function(publisher) {
      return this._publisherColorKey.withColor(publisher, publisher.id());
    }));
    

    topDatasets = _.map(topDatasets, bind(this, function(dataset) {
      return this._publisherColorKey.withColor(dataset, dataset.publisher().id());
    }));

    this._datasetsColumn = new VisitableList(this._app, topDatasets);
    
    var publishersList = new VisitableList(this._app, topPublishers);
    var publishersPie = new VisitablePie(this._app, topPublishers);
    this._publishersColumn = new PublishersColumn(this._app, publishersPie, publishersList); 

    render.toSelector(this._template, selector);

    this._publishersColumn.render(selector + "  " + this._publishersColumnSelector);
    this._datasetsColumn.render(selector + "  " + this._datasetsColumnSelector);
  },

  _onSelectPublisher: function(publisher) {
    this._datasetsColumn.update(_.map(this._topN(publisher.datasets()), bind(this, function(dataset) {
      return this._publisherColorKey.withColor(dataset, dataset.publisher().id()); 
    })));
  },

  _topN: function(collection) {
    return _.first(collection, this._app.nToDisplay);
  }
};
module.exports = PublishersDatasets;
