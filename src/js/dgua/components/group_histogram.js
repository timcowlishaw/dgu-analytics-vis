"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");
var bind = require("../util/bind");

var GroupHistogram = function(statistics) {
 this._statistics = statistics;
 this._yScale = d3.scale.linear().domain([0, statistics.max().value()]);
};

GroupHistogram.prototype = {

  _scale:  0.56,
  _margin: 4,

  render: function(selector) {
    this._element = slick.find(selector);
    var width = this._element.offsetWidth;
    var height = this._scale * width;
    dom.setAttribute(this._element, "style", "height:" + height  + "px;");
    this._yScale = this._yScale.range([0, height]);

    var svg = d3.select(this._element).append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");
    var barWidth =  width / this._statistics.size() - this._margin;
    var bar = svg.selectAll(".bar")
      .data(this._statistics.series())
      .enter().append("g")
      .attr("transform", bind(this, function(d, i) { 
        return "translate(" + i * (barWidth + this._margin) + ",0)";
      }));
    
    bar.append("rect")
      .attr("y", bind(this, function(d) { return height - this._yScale(d.value()); }))
      .attr("height", bind(this, function(d) { return this._yScale(d.value()); }))
      .attr("width", barWidth)
      .attr("fill", function(d) { return d.color(); });
  }
};

module.exports = GroupHistogram;
