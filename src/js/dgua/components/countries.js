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
var dom = require("ampersand-dom");
var events = require("dom-events");

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
  _backButtonSelector: ".back_button",

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
    var homeAwayTimeline = new SeriesLine(this._app, homeAwayStats.series("United Kingdom"));
    var homeAwayPie = new GroupPie(homeAwayStats, {rotation: 1 * Math.PI });
    var homeStat = homeAwayStats.last().proportionally().series()[0].value();
    var homeAwayPullquote = new PercentagePullQuote(homeStat, "of visits come from the UK");
    worldMap.render(selector + " " + this._worldMapSelector);
    homeAwayPullquote.render(selector + " " + this._homeAwayPullquoteSelector);
    homeAwayPie.render(selector + " " + this._homeAwayPieSelector);
    homeAwayTimeline.render(selector + " " + this._homeAwayTimelineSelector);
  },

  _onCountrySelected: function(name, statistic) {
    if(name) {
      this._hideHomeAwaySection();
      this._showBackButton();
      this._showCountrySection(name, statistic);
    } else {
      this._hideCountrySection();
      this._hideBackButton();
      this._showHomeAwaySection(); 
    }
  },

  _hideHomeAwaySection: function() {
    var homeAwaySection = slick.find(this._homeAwaySectionSelector);
    this._homeAwaySectionHeight = homeAwaySection.offsetHeight;
    style(homeAwaySection, {
      "position": "relative",
      "height": this._homeAwaySectionHeight + "px",
      "transition": "height 500ms, opacity 500ms" 
    });
    window.setTimeout(function() {
      style(homeAwaySection, {
        "height": "0px",
        "opacity": 0
      });
    }, 50);
  },

  _showHomeAwaySection: function() {
    var homeAwaySection = slick.find(this._homeAwaySectionSelector);
    window.setTimeout(bind(this, function() {
      style(homeAwaySection, {
        "height": this._homeAwaySectionHeight + "px",
        "opacity": "1.0"
      });
    }, 50));
  },

  _showCountrySection: function(name) {
    var statistic = this._repo.getStatistic("Country").oneVsAll(name);
    var countrySection = new CountrySummary(this._app, name, statistic);
    countrySection.render(this._selector + " " + this._countrySummarySelector);
  },

  _hideCountrySection: function() {
    var countrySectionContainer = slick.find(this._countrySummarySelector);
    dom.text(countrySectionContainer, ""); 
  },

  _showBackButton: function() {
    var backButtonContainer = slick.find(this._backButtonSelector);
    var link = document.createElement("a");
    dom.text(link, "\u00AB Back");
    dom.setAttribute(link, "href", "#");
    events.on(link, "click", bind(this, function(event) {
      event.preventDefault(); 
      this._app.sendMessage("countrySelected", null);
    }));
    backButtonContainer.appendChild(link);
  },

  _hideBackButton: function() {
    var backButtonContainer = slick.find(this._backButtonSelector);
    dom.text(backButtonContainer, "");
  },
};

module.exports = Countries;
