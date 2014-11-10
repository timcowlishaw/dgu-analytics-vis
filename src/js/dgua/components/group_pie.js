"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");

var GroupPie = function(group) {
  this._group = group;
};

GroupPie.prototype = {

  _scale: 0.80,
  _backgroundColor: "#fff", 

  render: function(selector) {
    this._element = slick.find(selector);
    
    var width = this._element.offsetWidth;
    dom.setAttribute(this._element, "style", "height:" + this._scale * width + "px;");
    this._radius = width / 2;

    var svg = d3.select(this._element)
      .append("svg") 
      .attr("width", width)
      .attr("height", width)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + this._scale * width / 2 + ") scale(" + this._scale + ")");
   
    this._layout = d3.layout.pie()
      .startAngle(1 * Math.PI)
      .endAngle(3 * Math.PI)
      .sort(null)
      .value(function(d) { console.log(d); return d.value(); });
   
    this._arc = d3.svg.arc()
      .outerRadius(this._radius)
      .innerRadius(0);
  
    this._slice = svg.datum(this._group.series()).selectAll("path").data(this._layout)
      .enter().append("path")
      .style("fill", function(d) { console.log(d, d.data); return d.data.color(); })
      .style("stroke", this._backgroundColor)
      .style("stroke-width", 1)
      .attr("d", this._arc);
  }
};

module.exports = GroupPie;
