"use strict";
var _ = require("underscore");
var decorateWith = require("./decorate_with");
var defaultColors = require("./colors");

var ColorKey = function(items, colors) {
  this._colors = colors ? colors : defaultColors;
  this._items = items;
};

ColorKey.prototype = {
  withColor: function(object, item) {
    if(!item) item = object;
    var color = this._colors[_.indexOf(this._items, item)]; 
    return decorateWith(object, {color: function() { return color; }});
  }
};

module.exports = ColorKey;
