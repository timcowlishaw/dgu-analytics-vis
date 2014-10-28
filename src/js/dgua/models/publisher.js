"use strict";
var withVisitProportions = require("../util/with_visit_proportions");


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
    return parseInt(this._data["Views"]); 
  },

  datasets : function() {
    return withVisitProportions(this._getDatasets(this), this.visits());
  },

  publisher: function() {
    return this;
  }
};

module.exports = Publisher;

