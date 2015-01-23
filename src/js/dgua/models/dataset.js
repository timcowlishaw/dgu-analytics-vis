"use strict";

var Dataset = function(data, getPublisher) {
  this._data = data;
  this._getPublisher = getPublisher;
};

Dataset.prototype = {
  id: function() {
    return this._data["Dataset Name"]; 
  },

  title: function() {
    return this._data["Dataset Title"]; 
  },

  subtitle: function() {
    return this.publisher().title(); 
  },

  url: function() {
    return "/dataset/" + this.id(); 
  },

  visits: function() {
    return parseInt(this._data["Visits"]); 
  },

  views: function() {
    return this._data["Views"]; 
  },

  publisher: function() {
    return this._getPublisher(this);
  },
};

module.exports = Dataset;
