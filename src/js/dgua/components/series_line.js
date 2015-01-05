"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");
var bind = require("../util/bind");
var decorateWith = require("../util/decorate_with");
var SeriesLine = function(app, series, opts) {
  if(!opts) opts = {};
  this._app = app;
  this._series = series;
  this._aspect = opts.aspect || 1/10;
  this._points = opts.points;
  this._mouseOver = opts.mouseOver;
};

SeriesLine.prototype = {

  _margin: 16,

  render: function(selector) {
    this._element = slick.find(selector);
    var outerWidth = this._element.offsetWidth;
    this._width = outerWidth - this._margin * 2;
    this._height = this._aspect * outerWidth - this._margin * 2;
    dom.setAttribute(this._element, "style", "height:" + this._aspect * outerWidth + "px;");

    this._x = d3.time.scale()
      .range([0, this._width])
      .domain([this._series.startTime(), this._series.endTime()]);

    this._y = d3.scale.linear()
      .range([0, this._height])
      .domain([this._series.max().value(), 0]);

    this._svg = d3.select(this._element).append("svg")
      .attr("width", this._width + 2 * this._margin)
      .attr("height", this._height + 2 * this._margin)
      .append("g")
      .attr("transform", "translate(" + this._margin + "," + this._margin + ")");

    this._container = this._svg.append("g");

    this._renderAxes();
    this._renderLine();
    if(this._points) this._renderPoints();
    if(this._mouseOver) this._setupListeners();
  },

  _renderAxes: function() {
    var xAxis = d3.svg.axis()
      .scale(this._x)
      .tickSize(4);

    var yAxis = d3.svg.axis()
      .scale(this._y)
      .ticks(0)
      .tickSize(0)
      .orient("left");
    
    this._svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this._height + ")")
      .call(xAxis);

    this._svg.append("g")
      .attr("class", "y axis")
      .call(yAxis); 
  },

  _renderLine: function() {
    var line = d3.svg.line()
      .interpolate("monotone")
      .x(bind(this, function(d) { return this._x(d.time()); }))
      .y(bind(this, function(d) { return this._y(d.value()); }));
    

    this._container.append("path")
      .datum(this._series.statistics())
      .attr("class", "line")
      .attr("stroke", this._series.color())
      .attr("stroke-width", "2")
      .attr("d", line)
      .attr("fill", "none");
  },
     
  _renderPoints: function() {
    this._container.selectAll(".point")
      .data(this._series.statistics()) 
      .enter().append("circle")
      .attr("class", "point")
      .attr("stroke", "none")
      .attr("fill", this._series.color())
      .attr("r", 4)
      .attr("cx", bind(this, function(d) { return this._x(d.time()); }))
      .attr("cy", bind(this, function(d) { return this._y(d.value()); }));
  },

  _setupListeners: function() {
    if(!this._mouseOverlay) {
      this._mouseOverlay = this._svg.append("rect")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .attr("stroke", "none")
        .attr("class", "overlay")
        .attr("width", this._width)
        .attr("height", this._height)
        .on("mousemove", bind(this, this._mouseMoveGraph)) 
        .on("mouseout", bind(this, this._mouseOutGraph))
        .node();
    }
  },

  _mouseMoveGraph: function() {
    var x = d3.mouse(this._mouseOverlay)[0];
    var time = this._x.invert(x);
    var stat = this._series.closestStat(time);
    stat = decorateWith(stat, {
      x: bind(this, function() { return this._element.offsetLeft + this._margin + this._x(stat.time()); }), 
      y: bind(this, function() { return this._element.offsetTop + this._margin + this._y(stat.value()); })
    });
    this._renderHighlight(stat);
    this._app.sendMessage("statisticHighlighted", stat);
  },

  _mouseOutGraph: function() { 
    this._clearHighlight();
    this._app.sendMessage("statisticHighlighted", null);
  },

  _clearHighlight: function() {
    this._container.selectAll(".highlight")
      .data([])
      .exit().remove();
  },

  _renderHighlight: function(stat) {
    this._clearHighlight();
    this._container.selectAll(".highlight")
      .data([stat])
      .enter().append("circle")
      .attr("class", "highlight")
      .attr("fill", "none")
      .attr("stroke", this._series.color())
      .attr("stroke-width", 3)
      .attr("r", 8)
      .attr("cx", bind(this, function(d) { return this._x(d.time()); }))
      .attr("cy", bind(this, function(d) { return this._y(d.value()); }));  
  },
    
};

module.exports = SeriesLine;
