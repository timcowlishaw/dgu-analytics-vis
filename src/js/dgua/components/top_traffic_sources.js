"use strict";

var fs = require("fs");
var render = require("../util/render");
var GroupKeyWithPercentage = require("./group_key_with_percentage");
var GroupPie = require("./group_pie");
var ColorKey = require("../util/color_key");
var colors = require("../util/colors");

var TopTrafficSources = function(app, statistics) {
  this._app = app;
  var colorKey = new ColorKey(statistics.keys(), colors);
  this._statistics = statistics.map(function(series, key) {
    return colorKey.withColor(series, key);
  });
};

TopTrafficSources.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/top_traffic_sources.mustache", "utf8"),
  _pieSelector : ".pie_container",
  _keySelector : ".key_container",
  
  render: function(selector) {
    render.toSelector(this._template, selector);
    var pie = new GroupPie(this._statistics);
    var key = new GroupKeyWithPercentage(this._statistics);
    pie.render(selector + " " + this._pieSelector);
    key.render(selector + " " + this._keySelector);
  }
};

module.exports = TopTrafficSources;
