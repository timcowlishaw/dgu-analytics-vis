"use strict";

var render = require("../util/render");
var fs = require("fs");
var GroupPie = require("./group_pie");
var SeriesLine = require("./series_line");
var PercentagePullQuote = require("./percentage_pull_quote");
var ColorKey = require("../util/color_key");
var colors = require("../util/colors");
var bind = require("../util/bind");

var CountrySummary = function(app, name, statistics) {
  this._app = app;
  this._name = name;
  this._statistics = statistics;
};

CountrySummary.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/country_summary.mustache", "utf8"),
 
  _timeSeriesSelector: ".time_series",
  _pieChartSelector: ".pie_chart",
  _pullQuoteSelector: ".pull_quote",

  render: function(selector) {
    render.toSelector(this._template, selector, {name : this._name});
    var key = new ColorKey(this._statistics.keys(), [colors.base, colors.neutral]);
    var statistics = this._statistics.map(bind(key, key.withColor));
    var last = statistics.last().map(bind(key, key.withColor));
    var series = statistics.series(this._name);
    var timeline = new SeriesLine(this._app, series);
    var pie = new GroupPie(last);
    var proportion = last.proportionally().series()[0].value();
    var pullQuote = new PercentagePullQuote(proportion, "of all visits");
    timeline.render(selector + " " + this._timeSeriesSelector);
    pullQuote.render(selector + " " + this._pullQuoteSelector);
    pie.render(selector + " " + this._pieChartSelector);
  }
};

module.exports = CountrySummary;
