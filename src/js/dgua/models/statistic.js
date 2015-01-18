"use strict";

var Group = require("./group");

var Statistic = function(period, value) {
  this._period = period;
  this._value = value;
};

Statistic.prototype = {
  period: function() {
    return this._period;
  },

  time: function() {
    return Date.parse(this._period); 
  },

  value: function() {
    return parseFloat(this._value);
  },

  min: function() {
    return this; 
  },

  max: function() {
    return this; 
  },

  total: function() {
    return this; 
  },

  first: function() {
    return this; 
  },

  last: function() {
    return this; 
  },

  proportionally: function(total) {
    return this.map(function(v) { return v / total; });
  },

  log: function() {
    return this.map(function(v) { return Math.log(v); });
  },

  dampen: function(p) {
    return this.map(function(v) { return Math.pow(v, p-1)  / p; });
  },

  sqrt: function() {
    return this.map(function(v) { return Math.sqrt(v); });
  },

  merge: function(other) {
    return this.map(function(v) { return v + other.value(); });
  },

  toProportionalGroup: function(total, seriesName, otherSeriesName) {
    var g = new Group();
    g.add(seriesName, this);
    g.add(otherSeriesName || "Others", this.map(function(v) { return total - v; }));
    return g;
  },

  map: function(callback) {
    return new Statistic(this.period(), callback(this.value()));
  }
};

module.exports = Statistic;
