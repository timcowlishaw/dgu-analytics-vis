"use strict";

var slick = require("slick");
var d3 = require("d3-browserify");
var dom = require("ampersand-dom");
var bind = require("../util/bind");
var ProportionalSeriesArea = function(app, series, opts) {
  if(!opts) opts = {};
  this._app = app;
  this._series = series;
  this._aspect = opts.aspect || 1/10;
  this._complementColor = opts.complementColor;
  this._notHighlightedColor = opts.notHighlightedColor;
};

ProportionalSeriesArea.prototype = {

  _vMargin: 16,
  _hMargin: 32,

  render: function(selector) {
    this._element = slick.find(selector);
    var outerWidth = this._element.offsetWidth;
    this._width = outerWidth - this._hMargin * 2;
    this._height = this._aspect * outerWidth - this._vMargin * 2;
    dom.setAttribute(this._element, "style", "height:" + this._aspect * outerWidth + "px;");
    
    this._x = d3.scale.ordinal()
      .domain(this._series.times())
      .rangeRoundBands([0, this._width], 0.1);
    
    this._axisX = d3.time.scale()
      .range([0, this._width])
      .domain([this._series.startTime(), this._series.endTime()]);
    
    this._y = d3.scale.linear()
      .range([0, this._height])
      .domain([0, 1]);

    this._axisY = d3.scale.linear()
      .range([0, this._height])
      .domain([1, 0]);

    this._svg = d3.select(this._element).append("svg")
      .attr("width", this._width + 2 * this._hMargin)
      .attr("height", this._height + 2 * this._vMargin)
      .append("g")
      .attr("transform", "translate(" + this._hMargin + "," + this._vMargin + ")");

    this._container = this._svg.append("g");

    this._renderAxes();
    this._renderChunks();
  },

  _renderAxes: function() {
    var xAxis = d3.svg.axis()
      .scale(this._axisX)
      .tickSize(4);

    var yAxis = d3.svg.axis()
      .scale(this._axisY)
      .ticks(5)
      .orient("left")
      .tickFormat(d3.format(".0%"));
    
    this._svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this._height + ")")
      .call(xAxis);

    this._svg.append("g")
      .attr("class", "y axis")
      .call(yAxis); 
  },

  _renderChunks: function() {
    this._svg.selectAll(".datum")
      .data(this._series.statistics())
      .enter().append("g")
        .attr("transform", bind(this, function(stat) {
          return "translate(" + this._x(stat.time()) +  ",0)";
        }))
        .attr("class", "bar")
        .call(bind(this, function(bar) {
          this._seriesRect = bar.append("rect")
            .attr("x", 0)
            .attr("width", this._x.rangeBand())
            .attr("height", bind(this, function(stat) { return this._y(stat.value()); }))
            .attr("y", bind(this, function(stat) { return this._height - this._y(stat.value()); }))
            .attr("fill", this._series.color())
            .on("mouseover", bind(this, this._onMouseOver))
            .on("mouseout", bind(this, this._onMouseOut));

          this._complementRect = bar.append("rect")
            .attr("x", 0)
            .attr("width", this._x.rangeBand())
            .attr("height", bind(this, function(stat) { return this._height - this._y(stat.value()) - 3; }))
            .attr("y", 0)
            .attr("fill", this._complementColor)
            .on("mouseover", bind(this, this._onMouseOver))
            .on("mouseout", bind(this, this._onMouseOut));
        }));

  },

  _onMouseOver: function(stat) {
    this._mouseOutDebounce = false;
    this._seriesRect.attr("fill", bind(this, function(d) {
      if(d.period() == stat.period()) {
        return this._series.color();
      } else {
        return this._notHighlightedColor; 
      }
    }));
    this._complementRect.attr("fill", bind(this, function(d) {
      if(d.period() == stat.period()) {
        return this._complementColor;
      } else {
        return this._notHighlightedColor; 
      }
    }));
    this._app.sendMessage("statisticHighlighted", stat);
  },



  _onMouseOut: function() { 
    this._mouseOutDebounce = true;
    window.setTimeout(bind(this, function() {
      if(this._mouseOutDebounce)  {
        this._seriesRect.attr("fill", this._series.color());
        this._complementRect.attr("fill", this._complementColor);
        this._app.sendMessage("statisticHighlighted", null);
      }
      this._mouseOutDebounce = false;
    }), 50);
  }  
};

module.exports = ProportionalSeriesArea;
