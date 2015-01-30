"use strict";
var d3 = require("d3-browserify");
var slick = require("slick");
var dom = require("ampersand-dom");
var colors = require("../util/colors");
var fs = require("fs");
var bind = require("../util/bind");
var render = require("../util/render");
var GroupKeyWithPercentage = require("./group_key_with_percentage");

var HorizontalHistogram = function(statistics, options) {
 if(!options) options = {};
 this._statistics = statistics;
 this._xScale = d3.scale.linear().domain([0, statistics.max().value()]);
 this._rtl = options.rtl;
 this._labels = options.labels;
};

HorizontalHistogram.prototype = {
  
  _scale:  0.56,
  _margin: 4,

  _template: fs.readFileSync(__dirname + "/../../../templates/horizontal_histogram.mustache", "utf8"),

  render: function(selector) {
    this._selector = selector;
    render.toSelector(this._template, selector, this.params()); 
    this._chartElement = slick.find(selector  + " .chart");
    this._width = this._chartElement.offsetWidth;
    this._height = this._scale * this._width;
    dom.setAttribute(this._chartElement, "style", "height:" + this._height  + "px;");
    this.xScale = this._xScale.range([0, this._width]);
    
    this._renderBars();
    if(this._labels) this._renderLabels();
  },

  _renderBars: function() {
    var svg = d3.select(this._chartElement).append("svg")
      .attr("width", this._width)
      .attr("height", this._height)
      .append("g");
    var barHeight =  this._height / this._statistics.size() - this._margin;
    var bar = svg.selectAll(".bar")
      .data(this._statistics.series())
      .enter().append("g")
      .attr("transform", bind(this, function(d, i) { 
        var x = this._rtl ? this._width - this._xScale(d.value()) : 0;
        var y = i * (barHeight + this._margin);
        return "translate(" + x + ", " + y + ")";
      }));
    
    bar.append("rect")
      .attr("height", barHeight )
      .attr("width", bind(this, function(d) { return this._xScale(d.value()); }))
      .attr("fill", function(d) { return d.color ? d.color() : colors.neutral; });
  },

  _renderLabels: function() {
    var rowHeight =  this._height / this._statistics.size();
    var labels = new GroupKeyWithPercentage(this._statistics, { chip: false, rowHeight: rowHeight, rowMargin: this._margin});

    labels.render(this._selector + " .labels");
  },

  params: function() {
    return {
      labels_left: this._labels && ! this._rtl,
      labels_right: this._labels && this._rtl,
      chart_pure_class: this._labels ? "pure-u-1-2 pure-u-md-1-2" : "pure-u-1 pure-u-md-1"
    }; 
  }
};

module.exports = HorizontalHistogram;

