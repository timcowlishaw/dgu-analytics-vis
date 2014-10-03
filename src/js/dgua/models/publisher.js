"use strict";

var Publisher = function(data, getDatasets) {
  this._data = data;
  this._getDatasets = getDatasets;
};

Publisher.prototype = {
  id : function() {
    return this._data["Publisher Name"]; 
  },

  title: function() {
    return this._data["Publisher Title"]; 
  },

  subtitle: function() {
    return ""; 
  },

  visits : function() {
    return parseInt(this._data["Visits"]); 
  },

  views: function() {
    return this._data["Views"]; 
  },

  datasets : function() {
    return this._getDatasets(this);
  },
};

module.exports = Publisher;

