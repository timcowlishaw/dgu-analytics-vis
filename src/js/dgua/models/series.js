"use strict";

var _ = require("underscore");
var Heap = require("heap");
var bind = require("../util/bind");

var Series = function(data) {
  this._index = new Heap();
  this._data = {};
  _.each(data, bind(this, function(datum) {
    this.add(datum);
  }));
};

Series.prototype = {

  add: function(statistic) {
    var time = statistic.time();
    this._data[time] = statistic;
    this._index.push(time);
  },

  at: function(time) {
    return this._data[time]; 
  },

  value: function() {
    return this.last().value(); 
  },

  map: function(callback) {
    return _.map(this._index.toArray(), bind(this, function(t) { return callback(this.at(t)); }));
  },

  statistics: function() {
    return this.map(function(x) { return x; } ); 
  },

  values: function() {
    return this.map(function(s) { return s.value(); });
  },

  times: function() {
    return this._index.toArray();
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
    return this.statistics()[this._index.size() - 1].last();
  },

  length: function() {
    return _.reduce(this.statistics(), function(m, s) { return m.length().merge(s.length()); });
  },

  proportionally: function(max) {
    return new Series(this.map(function(s) { return s.proportionally(max); })); 
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
    return new Series(values);
  }
};

module.exports = Series;

