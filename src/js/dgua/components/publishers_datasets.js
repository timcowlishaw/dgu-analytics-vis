"use strict";

var render = require("../util/render");
var fs = require("fs");

var PublishersDatasets = function(publishersColumn, datasetsColumn) {
  this._publishersColumn = publishersColumn;
  this._datasetsColumn = datasetsColumn;
};

PublishersDatasets.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/publishers_datasets.mustache", "utf8"),

  _publishersColumnSelector: ".publishers",
  _departmentsColumnSelector: ".departments",

  render: function(selector) {
    render.toSelector(this._template, selector);
    this._publishersColumn.render(selector + "  " + this._publishersColumnSelector);
    this._datasetsColumn.render(selector + "  " + this._datasetsColumnSelector);
  }
};
module.exports = PublishersDatasets;
