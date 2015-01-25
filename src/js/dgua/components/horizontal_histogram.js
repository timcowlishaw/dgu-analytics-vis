"use strict";
var d3 = require("d3-browserify");
var slick = require("slick");
var dom = require("ampersand-dom");
var colors = require("../util/colors");
var bind = require("../util/bind");
var HorizontalHistogram = function(statistics) {
 this._statistics = statistics;
 this._xScale = d3.scale.linear().domain([0, statistics.max().value()]);
};

HorizontalHistogram.prototype = {
  
  _scale:  0.56,
  _margin: 4,
  
  render: function(selector) {
    this._element = slick.find(selector);
    var width = this._element.offsetWidth;
    var height = this._scale * width;
    dom.setAttribute(this._element, "style", "height:" + height  + "px;");
    this.xScale = this._xScale.range([0, width]);
    
    var svg = d3.select(this._element).append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");
    var barHeight =  height / this._statistics.size() - this._margin;
    var bar = svg.selectAll(".bar")
      .data(this._statistics.series())
      .enter().append("g")
      .attr("transform", bind(this, function(d, i) { 
        return "translate(0, " + i * (barHeight + this._margin) + ")";
      }));
    
    bar.append("rect")
      .attr("height", barHeight )
      .attr("width", bind(this, function(d) { return this._xScale(d.value()); }))
      .attr("fill", function(d) { return d.color ? d.color() : colors.neutral; });
  }
};

module.exports = HorizontalHistogram;

