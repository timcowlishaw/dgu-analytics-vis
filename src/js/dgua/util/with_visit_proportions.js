"use strict";
var _ = require("underscore");
var decorateWith = require("./decorate_with");

module.exports = function(collection, totalVisits) {
  return _.map(collection, function(item) {
    return decorateWith(item, {
      visitsProportion: function() {
        return this.visits() / totalVisits;
      } 
    }); 
  }); 
};
