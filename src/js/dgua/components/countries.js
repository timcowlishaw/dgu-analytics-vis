"use strict";

var render = require("../util/render");
var fs = require("fs");
var WorldMap = require("./world_map");
var GroupPie = require("./group_pie");
var SeriesLine = require("./series_line");
var ColorKey = require("../util/color_key");
var PercentagePullQuote = require("./percentage_pull_quote");
var CountrySummary = require("./country_summary");
var colors = require("../util/colors");
var bind = require("../util/bind");
var style = require("dom-style");
var slick = require("slick");

var Countries = function(app, repo) {
  this._app = app;
  this._repo = repo;
  this._app.registerMessageHandler("countrySelected", bind(this, this._onCountrySelected));
};

Countries.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/countries.mustache", "utf8"),

  _worldMapSelector: ".world_map_container",
  _homeAwayPieSelector: ".home_away_pie_container",
  _homeAwayTimelineSelector: ".home_away_timeline_container",
  _homeAwayPullquoteSelector: ".home_away_pullquote_container",
  _homeAwaySectionSelector: ".home_away",
  _countrySummarySelector: ".country_summary_container",

  render : function(selector) {
    this._selector = selector;
    render.toSelector(this._template, selector);
    var statistics = this._repo.getStatistic("Country");
    var worldMap = new WorldMap(this._app, this._repo, statistics);
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
  },

  _onCountrySelected: function(name, statistic) {
    this._hideHomeAwaySection();
    this._showCountrySection(name, statistic);
  },

  _hideHomeAwaySection: function() {
    var homeAwaySection = slick.find(this._homeAwaySectionSelector);
    style(homeAwaySection, {
      "position": "relative",
      "height": homeAwaySection.offsetHeight + "px",
      "transition": "height 500ms, opacity 500ms" 
    });
    window.setTimeout(function() {
      style(homeAwaySection, {
        "height": "0px",
        "opacity": 0
      });
    }, 50);
  },

  _showCountrySection: function(name) {
    var statistic = this._repo.getStatistic("Country").oneVsAll(name);
    var countrySection = new CountrySummary(name, statistic);
   countrySection.render(this._selector + " " + this._countrySummarySelector);
  }
};

module.exports = Countries;
