"use strict";

var render = require("../util/render");
var fs = require("fs");
var SeriesLine = require("./series_line");
var style = require("dom-style");
var slick = require("slick");
var bind = require("../util/bind");
var HoverBox = require("./hover_box");
var SocialMonthSummary = require("./social_month_summary");

var SocialTimeSeries = function(app, repo, series) {
  this._app = app;
  this._repo = repo;
  this._series = series;
  this._app.registerMessageHandler("statisticHighlighted", bind(this, this._highlightStat));
};

SocialTimeSeries.prototype = {
  _innerSelector: ".social_timeseries",
  _aspect: 6/16,
  _template: fs.readFileSync(__dirname + "/../../../templates/social_time_series.mustache", "utf8"),
  _lineSelector: ".line_container",

  render: function(selector) {
    this._selector = selector;
    render.toSelector(this._template, selector);
    var element = slick.find(this._innerSelector);
    var width = element.offsetWidth;
    var height = this._aspect * width;
    style(element, {
      "height": height + "px"
    });
    var line = new SeriesLine(this._app, this._series, {aspect : this._aspect, points: true, mouseOver: true});
    line.render(selector + " " + this._lineSelector); 
  },

  _highlightStat: function(stat) {
    if(slick.find(this._selector + " " + this._lineSelector)) { // this tab is rendered;
      if(this._activeHover) this._activeHover.destroy();
      if(stat) {
        var content = new SocialMonthSummary(this._app, this._repo, stat);
        this._activeHover = new HoverBox(this._app, content);
        this._activeHover.render(this._selector, stat.x(), stat.y());
      }
    }
  },
};

module.exports = SocialTimeSeries;
