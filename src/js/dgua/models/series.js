"use strict";

var _ = require("underscore");
var Heap = require("heap");

var Series = function(data) {
  this._data = new Heap(function(a, b) {
    return a.time() - b.time();
  });
  _.each(data, function(datum) {
    this.add(datum);
  });
};

Series.prototype = {

  add: function(statistic) {
    this._data.push(statistic);
  },

  statistics: function() {
    return this._data.toArray(); 
  },

  values: function() {
    return _.map(this.statistics(), function(s) { return s.value(); });
  },

  total: function() {
    return _.reduce(this.statistics(), function(m, s) { return m.total().merge(s.total()); });
  },

  min: function() {
    return _.min(
      _.map(this.statistics(), function(s) { return s.min(); }),
      function(s) { return s.value(); }
    );
  },

  max: function() {
    return _.max(
      _.map(this.statistics(), function(s) { return s.max(); }),
      function(s) { return s.value(); }
    );
  },

  first: function() {
    return this.statistics()[0].first();
  },

  last: function() {
    return this.statistics()[this.statistics().length - 1].last();
  },

  length: function() {
    return _.reduce(this.statistics(), function(m, s) { return m.length().merge(s.length()); });
  },

  proportionally: function(max) {
    return new Series(_.map(this.statistics(), function(s) { return s.proportionally(max); })); 
  },

  merge: function(other) {
    //FIXME start here Tim.
  }
};

module.exports = Series;

