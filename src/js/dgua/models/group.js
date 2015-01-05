"use strict";

var _ = require("underscore");
var bind = require("../util/bind");

var Group = function(series) {
  this._series = {};
  _.each(series, bind(this, function(k) {
    this.add(k, series[k]); 
  }));
};

Group.prototype = {
  add: function(key, series) {
    this._series[key] = series;
  },

  keys: function() {
    return _.keys(this._series); 
  },

  series: function(key) {
    if(key) {
      return this._series[key]; 
    } else {
      return _.values(this._series);
    }
  },

  size: function() {
    return _.size(this._series); 
  },

  total: function() {
    return _.reduce(this._series, function(m, s) {  return m.total().merge(s.total()); });
  },

  min: function() {
    return _.min(
      _.map(this._series, function(s) { return s.min(); }),
      function(s) { return s.value(); }
    );
  },

  max: function() {
    return _.max(
      _.map(this._series, function(s) { return s.max(); }),
      function(s) { return s.value(); }
    );
  },

  first: function() {
    return this.map(function(s) { return s.first(); });
  },

  last: function() {
    return this.map(function(s) { return s.last(); });
  },

  length: function() {
    return _.max(
      _.map(this._series, function(s) { return s.length(); }),
      function(s) { return s.value(); }
    );
  },

  log: function() {
    return this.map(function(s) {  return s.log(); }); 
  },

  dampen: function(p) {
    return this.map(function(s) {  return s.dampen(p); }); 
  },

  sqrt: function() {
    return this.map(function(s) {  return s.sqrt(); }); 
  },
  
  proportionally: function() {
    var total = this.total().value();
    return this.map(function(s) { return s.proportionally(total); });
  },

  each: function(callback) {
    _.each(_.keys(this._series), bind(this, function(k) { callback(k, this._series[k]); }));
  },

  without: function(discard) {
    return this.map(function(series, key) { if(key != discard) return series; });
  },
 
  merge: function(keeps) {
    if(!keeps) keeps = _.keys(this._series);
    var series = _.map(keeps, bind(this, function(k) { return this._series[k];}));
    return _.reduce(series, function(a, b) {
      return a.merge(b);
    });
  },

  oneVsAll: function(keep) {
    var keepSeries = this._series[keep];
    var series = _.omit(this._series, keep);
    var othersSeries = _.reduce(series, function(a, b) {
      return a.merge(b);
    });
    var group = new Group();
    group.add(keep, keepSeries);
    group.add("Others", othersSeries); 
    return group;
  },

  topN: function(n, withOthers) {
    var keepSeries = _.first(_.sortBy(_.keys(this._series), bind(this, function(s) {
      return -this._series[s].value();
    })), n);
    var group = new Group();
    _.each(keepSeries, bind(this, function(name) {  group.add(name, this._series[name]); }));
    if(withOthers) {
      var otherSeries = _.difference(this._series, _.map(keepSeries, bind(this, function(name) {
        return this._series[name];
      })));
      var others = _.reduce(otherSeries, function(a, b) {
        return a.merge(b);
      });
      group.add("Others", others);
    }
    return group;
  },

  map: function(callback) {
    return _.reduce(_.keys(this._series), bind(this, function(g, k) {
      var s = callback(this._series[k], k);
      if(s) g.add(k, s);
      return g;
    }), new Group());
  },

  sum: function() {
    return _.reduce(this.series(), function(a, b) {
      return a.merge(b);
    });
  },

  at: function(date) {
    return this.map(function(series) {
      return series.at(date);
    });
  }
};

module.exports = Group;
