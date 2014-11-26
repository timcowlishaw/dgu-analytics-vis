"use strict";

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

  length: function() {
    return new Statistic(this.period(), 1); 
  },

  proportionally: function(total) {
    return new Statistic(this.period(), this.value() / total);
  },

  log: function() {
    return new Statistic(this.period(), Math.log(this.value()));
  },

  dampen: function(p) {
    return new Statistic(this.period(), Math.pow(this.value(), p-1)  / p );
  },

  sqrt: function() {
    return new Statistic(this.period(), Math.sqrt(this.value()));
  },

  merge: function(other) {
    return new Statistic(this.period(), this.value() + other.value());
  }
};

module.exports = Statistic;
