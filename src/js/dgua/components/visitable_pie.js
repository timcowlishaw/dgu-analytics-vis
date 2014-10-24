"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");
var bind = require("../util/bind");

var VisitablePie = function(app, visitables) {
  this._app = app;
  this._visitables = visitables;
  this._app.registerMessageHandler("highlightPublisher", bind(this, this._onHighlightPublisher));
};

VisitablePie.prototype = {

  _leftMargin: 50,
  _rightMargin: 150,

  _notHighlightedColor: "#ddd",
  _backgroundColor: "#efefef",

  render: function(selector) {
    this._element = slick.find(selector);  
    
    var width = this._element.offsetWidth - this._leftMargin - this._rightMargin;
    dom.setAttribute(this._element, "style", "height:" + width + "px;");
    this._radius = width / 2;
    
    var svg = d3.select(this._element)
      .append("svg") 
      .attr("width", width + this._leftMargin + this._rightMargin)
      .attr("height", width)
      .append("g")
        .attr("transform", "translate("+ (width / 2 + this._leftMargin) + "," + width / 2 + ")");
    
    this._layout = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.visits(); });
    
    this._arc = d3.svg.arc()
      .outerRadius(this._radius)
      .innerRadius(0);

    this._slice = svg.datum(this._visitables).selectAll("path").data(this._layout)
      .enter().append("path")
      .style("fill", function(d) { return d.data.color(); })
      .style("stroke", this._backgroundColor)
      .style("stroke-width", 1)
      .attr("d", this._arc)
      .on("mouseover", bind(this, this._onMouseOver))
      .on("mouseout", bind(this, this._onMouseOut));
  },

  _onHighlightPublisher: function(publisher) {
    if(publisher) {
      this._slice.style("fill", bind(this, function(d) { 
        if(d.data.publisher().id() == publisher.id()) {  
          return d.data.color();
        } else {
          return this._notHighlightedColor; 
        }
      }));
    } else {
      this._slice.style("fill", function(d) { return d.data.color(); });
    }
    this._slice.attr("d", this._arc);
  },

  _onMouseOver: function(slice) {
    this._app.sendMessage("highlightPublisher", slice.data);
  },

  _onMouseOut: function() {
    this._app.sendMessage("highlightPublisher", null);
  }
};

module.exports = VisitablePie;
