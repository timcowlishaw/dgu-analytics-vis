"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");

var SeriesLine = function(series) {
  this._series = series;
};

SeriesLine.prototype = {

  _aspect: 1/10,

  render: function(selector) {
    this._element = slick.find(selector);   
    var width = this._element.offsetWidth;
    var height = this._aspect * width;
    dom.setAttribute(this._element, "style", "height:" + height + "px;");

    var x = d3.time.scale()
      .range([0, width])
      .domain([this._series.startTime(), this._series.endTime()]);

    var y = d3.scale.linear()
      .range([0, height])
      .domain([this._series.min().value(), this._series.max().value()]);

    var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.time()); })
      .y(function(d) { return y(d.value()); });
    
    var svg = d3.select(this._element).append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");
 
    svg.append("path")
      .datum(this._series.statistics())
      .attr("class", "line")
      .attr("stroke", "#f00")
      .attr("stroke-width", "2")
      .attr("d", line)
      .attr("fill", "none");
  
  }
};

module.exports = SeriesLine;
