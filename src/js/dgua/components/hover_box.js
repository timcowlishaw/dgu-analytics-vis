"use strict";

var d3 = require("d3-browserify");
var slick = require("slick");
var style = require("dom-style");
var _ = require("underscore");

var HoverBox = function(vis, contentComponent, opts) {
  if(!opts) opts = {};
  this._vis = vis;
  this._contentComponent = contentComponent;
  this._width = opts.width || "25%";
};

HoverBox.prototype = {
  render : function(selector, x, y) {
    _.each(slick.search(".hover"), function(e) { e.remove(); });
    d3.select(selector).append("div").attr("class", "hover");
    this._element = slick.find(".hover");
    style(this._element, { top: y + "px", width: this._width});
    var parentWidth = window.innerWidth;
    if(x < parentWidth / 2) {
      style(this._element, {left: x + "px"});
    } else {
      style(this._element, {right: (parentWidth - x) + "px"});
    }
    this._contentComponent.render(selector + " .hover");
  },

  destroy: function() {
    if(this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);    
    }
  },
};

module.exports = HoverBox;

