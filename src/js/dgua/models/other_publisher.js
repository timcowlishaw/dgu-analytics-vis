"use strict";

var _ = require("underscore");

var OtherPublisher = function(publishers) {
  this._publishers = publishers;
};

OtherPublisher.prototype = {
  id: function() {
    return -1; 
  },

  title: function() {
    return "Other";
  },

  subtitle: function() {
    return ""; 
  },

  visits: function() {
    var v = _.reduce(this._publishers, function(m, p) { return m + p.visits(); }, 0);
    return v;
  },

  views: function() {
    var v = _.reduce(this._publishers, function(m, p) { return m + p.views(); }, 0);
    return v;
  },

  datasets: function() {
    return _.flatten(_.map(this._publishers, function(p) { return p.datasets(); }));
  },

  publisher: function() {
    return this; 
  }
};

module.exports = OtherPublisher;
