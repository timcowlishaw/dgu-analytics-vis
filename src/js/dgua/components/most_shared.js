"use strict";

var fs = require("fs");
var render = require("../util/render");
var GroupKeyWithPercentage = require("./group_key_with_percentage");
var ColorKey = require("../util/color_key");
var colors = require("../util/colors");
var GroupHistogram = require("./group_histogram");

var MostShared = function(app, statistics) {
  this._app = app;
  var colorKey = new ColorKey(statistics.keys(), colors);
  this._statistics = statistics.map(function(series, key) {
    return colorKey.withColor(series, key);
  });
};

MostShared.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/most_shared.mustache", "utf8"),
  _keySelector : ".key_container",
  _histSelector: ".hist_container",
  render: function(selector) {
    render.toSelector(this._template, selector);
    var key = new GroupKeyWithPercentage(this._statistics);
    key.render(selector + " " + this._keySelector);
    var hist = new GroupHistogram(this._statistics);
    hist.render(selector + " " + this._histSelector);
  }
};

module.exports = MostShared;
