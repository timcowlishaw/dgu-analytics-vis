"use strict";

var fs = require("fs");
var render = require("../util/render");
var colors = require("../util/colors");
var decorateWith = require("../util/decorate_with");
var SeriesLine = require("./series_line");
var PercentagePullQuote = require("./percentage_pull_quote");
var dom = require("ampersand-dom");
var slick = require("slick");
var bind = require("../util/bind");

var Platforms = function(application, repo) {
  this._application = application;
  this._repo = repo;
  this._application.registerMessageHandler("statisticHighlighted", bind(this, this._renderQuotes));
};

Platforms.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/platforms.mustache", "utf8"),
  _lineSelector: ".timeseries_container",
  _computersQuoteSelector: ".computers_quote_container",
  _mobileQuoteSelector: ".mobile_quote_container",
  _aspect: 6/16,
  _mobilePlatforms: ["Android", "BlackBerry", "Chrome OS", "SymbianOS", "Windows Phone", "iOS", "Nokia", "Firefox OS", "Series40", "Samsung"],

  render : function(selector) {
    this._selector = selector;
    render.toSelector(this._template, selector); 
    var totals = this._repo.getStatistic("Totals").series("Total visits");
    var devicesSplit = this._repo.getStatistic("Operating Systems").merge(this._mobilePlatforms).asProportionOfSeries(totals);
    
    devicesSplit = decorateWith(devicesSplit, {
      color: function() { return colors[4]; } 
    });
  
    var seriesLine = new SeriesLine(this._application, devicesSplit, {aspect : this._aspect, points: true, mouseOver: true });
    seriesLine.render(selector + " " + this._lineSelector);
 
    this._defaultStat = devicesSplit.last();
    this._renderQuotes();
  },

  _renderQuotes: function(stat) {
    if(slick.find(this._selector + " " + this._computersQuoteSelector)) { // this tab is rendered;
      if(!stat) stat = this._defaultStat;
      dom.text(slick.find(this._selector + " " + this._computersQuoteSelector), "");
      var computersQuote = new PercentagePullQuote(stat.map(function(v) { return 1 - v; }).value());
      computersQuote.render(this._selector + " " + this._computersQuoteSelector);
      
      dom.text(slick.find(this._selector + " " + this._mobileQuoteSelector), "");
      var mobileQuote = new PercentagePullQuote(stat.value());
      mobileQuote.render(this._selector + " " + this._mobileQuoteSelector);
    } 
  },
};

module.exports = Platforms;
