"use strict";

var _ = require("underscore");
var bind = require("../util/bind");

var Series = function(data) {
  this._data = {};
  _.each(data, bind(this, function(datum) {
    this.add(datum);
  }));
};

Series.prototype = {

  add: function(statistic) {
    var time = statistic.time();
    this._data[time] = statistic;
  },

  at: function(time) {
    return this._data[time]; 
  },

  value: function() {
    return this.last().value(); 
  },

  map: function(callback) {
    return _.map(this.times(), bind(this, function(t) { return callback(this.at(t)); }));
  },

  statistics: function() {
    return this.map(function(x) { return x; } ); 
  },

  closestStat: function(time)  {
    var closestTime = _.min(this.times(), function(t) {
      return Math.abs(time - t);
    });
    return this.at(closestTime);
  },

  values: function() {
    return this.map(function(s) { return s.value(); });
  },

  periods: function() {
    return this.map(function(s) { return s.period(); }) ;
  },

  times: function() {
    return _.keys(this._data).sort();
  },

  total: function() {
    return _.reduce(this.statistics(), function(m, s) { return m.total().merge(s.total()); });
  },

  min: function() {
    return _.min(
      this.map(function(s) { return s.min(); }),
      function(s) { return s.value(); }
    );
  },

  max: function() {
    return _.max(
      this.map(function(s) { return s.max(); }),
      function(s) { return s.value(); }
    );
  },

  first: function() {
    return this.statistics()[0].first();
  },

  startTime: function() {
    return this.first().time(); 
  },

  endTime: function() {
    return this.last().time(); 
  },

  last: function() {
    return this.statistics()[_.size(this._data) - 1].last();
  },

  length: function() {
    return this.periods().length;
  },

  proportionally: function(total) {
    return new Series(this.map(function(s) { return s.proportionally(total); })); 
  },

  asProportionOfSeries: function(totalSeries) {
    var values = _.map(this.times(), bind(this, function(time) {
      var num = this.at(time);
      var denom = totalSeries.at(time);
      return num.proportionally(denom.value());
    }));
    return new Series(values);
  },

  log: function() {
    return new Series(this.map(function(s) { return s.log(); })); 
  },
  
  dampen: function(p) {
    return new Series(this.map(function(s) { return s.dampen(p); })); 
  },

  sqrt: function() {
    return new Series(this.map(function(s) { return s.sqrt(); })); 
  },

  merge: function(other) {
    var times = _.union(this.times(), other.times());
    var values = _.map(times, bind(this, function(time) {
      var a = this.at(time);
      var b = other.at(time);
      if(a && b) {
        return a.merge(b); 
      } else if(a) {
        return a; 
      } else if(b) {
        return b;
      }
    }));
    var s = new Series(values);
    return s;
  }
};

module.exports = Series;

