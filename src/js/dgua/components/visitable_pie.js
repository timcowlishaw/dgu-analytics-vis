"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");

var VisitablePie = function(app, visitables) {
  this._app = app;
  this._visitables = visitables;
};

VisitablePie.prototype = {

  _margin: 200,

  render: function(selector) {
    this._element = slick.find(selector);  
    
    var width = this._element.offsetWidth - this._margin;
    dom.setAttribute(this._element, "style", "height:" + width + "px;");
    var radius = width / 2;
    
    var svg = d3.select(this._element)
      .append("svg") 
      .attr("width", width + this._margin)
      .attr("height", width)
      .append("g")
        .attr("transform", "translate("+ (width / 2 + this._margin / 2) + "," + width / 2 + ")");
    
    var layout = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.visits(); });
    
    var arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(0);

    var slice = svg.datum(this._visitables).selectAll("path").data(layout)
      .enter().append("path")
      .style("fill", function(d) { console.log(d); return d.data.color(); })
      .style("stroke", "#fff")
      .style("stroke-width", 1)
      .attr("d", arc);
  }
};

module.exports = VisitablePie;
