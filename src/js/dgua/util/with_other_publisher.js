"use strict";

var decorateWith = require("./decorate_with");
var _ = require("underscore");

var withOtherPublisher = function(data, topPublishers, otherPublisher) {
  return _.map(data, function(datum) {
    return decorateWith(datum, {
      publisher: function() {
        if(_.contains(topPublishers, this._getPublisher(this))) {
          return this._getPublisher(this); 
        } else {
          return otherPublisher; 
        }
      }
    }); 
  });
};

module.exports = withOtherPublisher;
