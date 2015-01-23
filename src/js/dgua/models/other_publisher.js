"use strict";

var _ = require("underscore");
var withVisitProportions = require("../util/with_visit_proportions");

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

  url: function() {
    return undefined; 
  },

  visits: function() {
    return _.reduce(this._publishers, function(m, p) { return m + p.visits(); }, 0);
  },

  views: function() {
    return _.reduce(this._publishers, function(m, p) { return m + p.views(); }, 0);
  },

  datasets: function() {
    return withVisitProportions( 
      _.sortBy(
        _.flatten(_.map(this._publishers, function(p) { return p.datasets(); })),
        function(d) { return 0 - d.visits(); }
      ),
      this.visits()
    );
  },

  publisher: function() {
    return this; 
  }
};

module.exports = OtherPublisher;
