"use strict";

var render = require("../util/render");
var fs = require("fs");

var PublishersColumn = function(app, pieChart, list) {
  this._app = app;
  this._pieChart = pieChart;
  this._list = list;
};

PublishersColumn.prototype = {

 
  _template: fs.readFileSync(__dirname + "/../../../templates/publishers_column.mustache", "utf8"),
  
  _pieChartSelector: ".pie_container",
  _listSelector: ".list_container",

  render: function(selector) { 
    render.toSelector(this._template, selector);
    this._pieChart.render(selector + " " + this._pieChartSelector);
    this._list.render(selector + " " + this._listSelector);
  }
};

module.exports = PublishersColumn;

