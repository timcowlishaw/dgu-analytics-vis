"use strict";

var render = require("../util/render");
var fs = require("fs");
var WorldMap = require("./world_map");
var GroupPie = require("./group_pie");
var SeriesLine = require("./series_line");
var ColorKey = require("../util/color_key");
var colors = require("../util/colors");

var Countries = function(app, repo) {
  this._app = app;
  this._repo = repo;
};

Countries.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/countries.mustache", "utf8"),

  _worldMapSelector: ".world_map_container",
  _homeAwayPieSelector: ".home_away_pie_container",
  _homeAwayTimelineSelector: ".home_away_timeline_container",

  render : function(selector) {
    render.toSelector(this._template, selector);
    var statistics = this._repo.getStatistic("Country");
    var worldMap = new WorldMap(this._repo, statistics.sqrt());
    var homeAwayStats = statistics.oneVsAll("United Kingdom");
    var homeAwayColors = new ColorKey(homeAwayStats.keys(), [colors.complement, colors.neutral]);
    homeAwayStats = homeAwayStats.map(function(series, key) {
      return homeAwayColors.withColor(series, key);
    });
    var homeAwayTimeline = new SeriesLine(homeAwayStats.series("United Kingdom"));
    var homeAwayPie = new GroupPie(homeAwayStats);
    worldMap.render(selector + " " + this._worldMapSelector);
    homeAwayPie.render(selector + " " + this._homeAwayPieSelector);
    homeAwayTimeline.render(selector + " " + this._homeAwayTimelineSelector);
  }
};

module.exports = Countries;
