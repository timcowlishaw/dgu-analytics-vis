"use strict";
var _ = require("underscore");
var decorateWith = require("./decorate_with");

var ColorKey = function(items, colors) {
  this._colors = colors ? colors : this._defaultColors;
  this._items = items;
};

ColorKey.prototype = {
  _defaultColors: [
    "#8bc658", //DGU green
    "#FFF300", //yellow
    "#5140FF", //blue
    "#C42718", //red
    "#856499", //purple
    "#56C8F9" //light blue
  ],


  withColor: function(object, item) {
    if(!item) item = object;
    var color = this._colors[_.indexOf(this._items, item)]; 
    return decorateWith(object, {color: function() { return color; }});
  }
};

module.exports = ColorKey;
