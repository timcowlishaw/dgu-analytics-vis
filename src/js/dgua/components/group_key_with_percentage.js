"use strict";

var fs = require("fs");
var _ = require("underscore");
var render = require("../util/render");
var bind = require("../util/bind");

var GroupKeyWithPercentage = function(statistics) {
  this._statistics = statistics;
};

GroupKeyWithPercentage.prototype = {
  
  _template: fs.readFileSync(__dirname + "/../../../templates/group_key_with_percentage.mustache", "utf8"),

  render: function(selector) {
    render.toSelector(this._template, selector, this._templateParams());
  },

  _templateParams: function() {
    return { series: this._formattedSeries() };
  },

  _formattedSeries: function() {
    var proportionally = this._statistics.last().proportionally();
    var series = _.map(proportionally.keys(), function(k) {
      return [k, proportionally.series(k)];
    });
    return _.map(series, bind(this, this._formatSeries));
  },

  _formatSeries: function(pair) {
    var stat  = this._statistics.series(pair[0]);
    return {
      name: pair[0],
      color: stat.color && stat.color(),
      className: stat.color ? "with_chip" : "",
      percentage: this._formatPercentage(pair[1].value())
    };
  },

  _formatPercentage: function(number) {
    return (number * 100).toFixed(2) + "%";
  }

};

module.exports = GroupKeyWithPercentage;

