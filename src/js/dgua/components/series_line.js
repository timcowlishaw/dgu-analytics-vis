"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");

var SeriesLine = function(series) {
  this._series = series;
};

SeriesLine.prototype = {

  _aspect: 1/10,
  _margin: 16,

  render: function(selector) {
    this._element = slick.find(selector);
    var outerWidth = this._element.offsetWidth;
    var width = outerWidth - this._margin * 2;
    var height = this._aspect * outerWidth - this._margin * 2;
    dom.setAttribute(this._element, "style", "height:" + height + "px;");

    var x = d3.time.scale()
      .range([0, width])
      .domain([this._series.startTime(), this._series.endTime()]);

    var y = d3.scale.linear()
      .range([0, height])
      .domain([this._series.min().value(), this._series.max().value()]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .tickSize(4);

    var yAxis = d3.svg.axis()
      .scale(y)
      .ticks(0)
      .tickSize(0)
      .orient("left");

    var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.time()); })
      .y(function(d) { return y(d.value()); });
    
    var svg = d3.select(this._element).append("svg")
      .attr("width", width + 2 * this._margin)
      .attr("height", height + 2 * this._margin)
      .append("g")
      .attr("transform", "translate(" + this._margin + "," + this._margin + ")");
 
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    svg.append("g")
      .append("path")
      .datum(this._series.statistics())
      .attr("class", "line")
      .attr("stroke", this._series.color())
      .attr("stroke-width", "2")
      .attr("d", line)
      .attr("fill", "none");
  
  }
};

module.exports = SeriesLine;
