"use strict";

var render = require("../util/render");
var fs = require("fs");
var _ = require("underscore");
var bind = require("../util/bind");

var PublishersDatasets = function(app, publishersColumn, datasetsColumn, publishersColorKey, topN) {
  this._app = app;
  this._publishersColumn = publishersColumn;
  this._datasetsColumn = datasetsColumn;
  //FIXME this is a leak of responsibilities. Should these be instantiated here
  //or passed in?
  this._publishersColorKey = publishersColorKey;
  this._topN = topN;
  this._app.registerMessageHandler("selectPublisher", bind(this, this._onSelectPublisher));
};

PublishersDatasets.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/publishers_datasets.mustache", "utf8"),

  _publishersColumnSelector: ".publishers",
  _datasetsColumnSelector: ".datasets",

  render: function(selector) {
    render.toSelector(this._template, selector);
    this._publishersColumn.render(selector + "  " + this._publishersColumnSelector);
    this._datasetsColumn.render(selector + "  " + this._datasetsColumnSelector);
  },

  _onSelectPublisher: function(publisher) {
    this._datasetsColumn.update(_.map(_.first(publisher.datasets(), this._topN), bind(this, function(dataset) {
      return this._publishersColorKey.withColor(dataset, dataset.publisher().id()); 
    })));
  },
};
module.exports = PublishersDatasets;
