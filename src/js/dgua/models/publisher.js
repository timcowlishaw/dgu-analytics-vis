"use strict";

var Publisher = function(data, getDatasets) {
  this._data = data;
  this._getDatasets = getDatasets;
};

Publisher.prototype = {
  id : function() {
    return this._data["Publisher Name"]; 
  },

  visits : function() {
    return this._data["Visits"]; 
  },

  datasets : function() {
    return this._getDatasets(this);
  },
};

module.exports = Publisher;

