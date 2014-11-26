"use strict";

var Country = function(data) {
  this._data = data;
};

Country.prototype = {
  name : function() {
    return this._data["Country"]; 
  },

  latitude: function() {
    return this._data["Latitude"]; 
  },

  longitude: function() {
    return this._data["Longitude"]; 
  }
};

module.exports = Country;
