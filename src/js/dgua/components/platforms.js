"use strict";

var fs = require("fs");
var render = require("../util/render");
var colors = require("../util/colors");
var ColorKey = require("../util/color_key");
var decorateWith = require("../util/decorate_with");
var ProportionalSeriesArea = require("./proportional_series_area");
var PercentagePullQuote = require("./percentage_pull_quote");
var dom = require("ampersand-dom");
var slick = require("slick");
var bind = require("../util/bind");
var HorizontalHistogram = require("./horizontal_histogram");

var Platforms = function(application, repo) {
  this._application = application;
  this._repo = repo;
  this._application.registerMessageHandler("statisticHighlighted", bind(this, this._renderSections));
};

Platforms.mobile = ["Android", "BlackBerry", "Chrome OS", "SymbianOS", "Windows Phone", "iOS", "Nokia", "Firefox OS", "Series40", "Samsung"];

Platforms.desktopBrowsers = ['Chrome', 'Firefox', 'IE with Chrome Frame',
       'Internet Explorer', 'Mozilla Compatible Agent', 'Opera',
        'Safari', 'Safari (in-app)', 'SeaMonkey',
       'Camino', 'Playstation 3', 'Mozilla',
        'Maxthon', 'YaBrowser', '(not set)', 'Konqueror', 'Links',
       'SiteCon Browser', 'Iron'] 

Platforms.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/platforms.mustache", "utf8"),
  _lineSelector: ".timeseries_container",
  _computersQuoteSelector: ".computers_quote_container",
  _mobileQuoteSelector: ".mobile_quote_container",
  _computersBrowsersHistSelector: ".computers_browsers_histogram_container",
  _mobileHistSelector: ".mobile_histogram_container",
  _aspect: 6/16,

  render : function(selector) {
    this._selector = selector;
    render.toSelector(this._template, selector); 
    var totals = this._repo.getStatistic("Totals").series("Total visits");
    var devicesSplit = this._repo.getStatistic("Operating Systems").merge(Platforms.mobile).asProportionOfSeries(totals);
    
    devicesSplit = decorateWith(devicesSplit, {
      color: function() { return colors[4]; } 
    });
  
    var seriesArea = new ProportionalSeriesArea(this._application, devicesSplit, {aspect : this._aspect, complementColor: colors[5], notHighlightedColor: colors.neutral });
    seriesArea.render(selector + " " + this._lineSelector);
 
    this._defaultStat = devicesSplit.last();
    this._renderSections();
  },


  _renderSections: function(stat) {
    if(slick.find(this._selector + " " + this._computersQuoteSelector)) { // this tab is rendered;
      if(!stat) stat = this._defaultStat;
      dom.text(slick.find(this._selector + " " + this._computersQuoteSelector), "");
      var computersQuote = new PercentagePullQuote(stat.map(function(v) { return 1 - v; }).value());
      computersQuote.render(this._selector + " " + this._computersQuoteSelector);
      
      dom.text(slick.find(this._selector + " " + this._mobileQuoteSelector), "");
      var mobileQuote = new PercentagePullQuote(stat.value());
      mobileQuote.render(this._selector + " " + this._mobileQuoteSelector);
      
      dom.text(slick.find(this._selector + " " + this._computersBrowsersHistSelector), "");
      var computersBrowsers = this._repo.getStatistic("Browsers").filter(Platforms.desktopBrowsers).at(stat.time()).topN(4, true)
      var computersBrowsersKey = new ColorKey(computersBrowsers.keys(), colors);
      computersBrowsers = computersBrowsers.map(function(s, k) {
        return computersBrowsersKey.withColor(s, k);
      });
      var computersBrowsersHist = new HorizontalHistogram(computersBrowsers, {labels: true})
      computersBrowsersHist.render(this._selector + " " + this._computersBrowsersHistSelector);
 
      dom.text(slick.find(this._selector + " " + this._mobileHistSelector), "");
      var mobileOses = this._repo.getStatistic("Operating Systems").filter(Platforms.mobile).at(stat.time()).topN(4, true)
      var mobileKey = new ColorKey(mobileOses.keys(), colors);
      mobileOses = mobileOses.map(function(s, k) {
        return mobileKey.withColor(s, k);
      });
      var mobileHist = new HorizontalHistogram(mobileOses, {labels: true, rtl: true})
      mobileHist.render(this._selector + " " + this._mobileHistSelector);

    } 
  },
};

module.exports = Platforms;
