"use strict";

var render = require("../util/render");
var fs = require("fs");
var GroupPie = require("./group_pie");
var SeriesLine = require("./series_line");
var ColorKey = require("../util/color_key");
var colors = require("../util/colors");
var bind = require("../util/bind");
var slick = require("slick");

var CountrySummary = function(name, statistics) {
  this._name = name;
  this._statistics = statistics;
};

CountrySummary.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/country_summary.mustache", "utf8"),
 
  _timeSeriesSelector: ".time_series",
  _pieChartSelector: ".pie_chart",

  render: function(selector) {
    render.toSelector(this._template, selector, {name : this._name});
    var key = new ColorKey(this._statistics.keys(), [colors.base, colors.neutral]);
    var statistics = this._statistics.map(function(s, k) {
      return key.withColor(s, k); 
    });
    var series = statistics.series(this._name);
    var timeline = new SeriesLine(series);
    var pie = new GroupPie(statistics);
    timeline.render(selector + " " + this._timeSeriesSelector);
    pie.render(selector + " " + this._pieChartSelector);
  }
};

module.exports = CountrySummary;
