"use strict";

var fs = require("fs");
var render = require("../util/render");
var bind = require("../util/bind");
var slick = require("slick");
var events = require("dom-events");
var _ = require("underscore");
var VisitableList = require("./visitable_list");
var WorldMap = require("./world_map");
var withVisitProportions = require("../util/with_visit_proportions");
var Platforms = require("./platforms");
var GroupPie = require("./group_pie");
var colors = require("../util/colors");
var ColorKey = require("../util/color_key");
var GroupKey = require("./group_key_with_percentage");
var GroupHistogram = require("./group_histogram");
var style = require("dom-style");

var Dashboard = function(app, repo) {
  this._app = app;
  this._repo = repo;
};

Dashboard.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/dashboard.mustache", "utf8"),
  render: function(selector) {
    render.toSelector(this._template, selector); 
    this._selector = selector;
    this._element = slick.find(selector);
    this._setupLinks();
    this._setupGraphics();
    this._normaliseHeights();
  },

  _setupLinks: function() {
    events.on(slick.find(".datasets_link", this._element), "click", bind(this, function(event) {
      event.preventDefault();
      this._app.sendMessage("switchTab", "Datasets"); 
    })); 
    events.on(slick.find(".countries_link", this._element), "click", bind(this, function(event) {
      event.preventDefault();
      this._app.sendMessage("switchTab", "Countries"); 
    })); 
    events.on(slick.find(".platforms_link", this._element), "click", bind(this, function(event) {
      event.preventDefault();
      this._app.sendMessage("switchTab", "Platforms"); 
    })); 
    events.on(slick.find(".social_link", this._element), "click", bind(this, function(event) {
      event.preventDefault();
      this._app.sendMessage("switchTab", "Social"); 
    }));  
  },

   _setupGraphics: function() {
    var datasets = withVisitProportions(
      _.first(this._repo.getDatasetsByVisits(), 3),
      this._repo.getTotalDatasetVisits());
    var list = new VisitableList(this._app, datasets, {color: false});
    list.render(this._selector + " " + " .datasets_container");
    
    var countries = this._repo.getStatistic("Country");
    var worldMap = new WorldMap(this._app, this._repo, countries, {withoutUK: false});
    worldMap.render(this._selector + " .countries_container");

    var platforms = this._repo.getStatistic("Operating Systems").partition(Platforms.mobile, "Mobile", "Desktop");
    var platformsColors = new ColorKey(platforms.keys(), [colors[5], colors[4]]);
    platforms = platforms.map(function(series, key) {
      return platformsColors.withColor(series, key);
    });
    var platformsPie = new GroupPie(platforms);
    platformsPie.render(this._selector + " .platforms_chart_container");
    var platformsKey = new GroupKey(platforms);
    platformsKey.render(this._selector + " .platforms_key_container");

    var socialSources = this._repo.getStatistic("Social sources").proportionally().topN(4, true);
    var socialColors = new ColorKey(socialSources.keys(), colors);
    socialSources = socialSources.map(function(series, key) {
      return socialColors.withColor(series, key);
    });
    var socialHist = new GroupHistogram(socialSources);
    socialHist.render(this._selector + " .social_chart_container");
    var socialKey = new GroupKey(socialSources);
    socialKey.render(this._selector + " .social_key_container");
  },

   _normaliseHeights: function() {
    _.each(slick.search(".row"), function(row) {
      var cols = slick.search(".card", row);
      var height = _.max(_.map(cols, function(col) { return col.offsetHeight; }));
      _.each(cols, function(col) {
        style(col, {"height": height + "px" }) ;
      });
    });
   }
};

module.exports = Dashboard;
