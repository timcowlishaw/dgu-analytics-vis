"use strict";

var Dataset = function(data, getPublisher) {
  this._data = data;
  this._getPublisher = getPublisher;
};

Dataset.prototype = {
  id: function() {
    return this._data["Dataset Name"]; 
  },

  visits: function() {
    return this._data["Visits"]; 
  },

  publisher: function() {
    return this._getPublisher(this);
  },
};

module.exports = Dataset;
