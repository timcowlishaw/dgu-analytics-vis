"use strict";

var fs = require("fs");
var render = require("../util/render");
var TopTrafficSources = require("./top_traffic_sources");
var MostShared = require("./most_shared");
var PercentagePullQuote = require("./percentage_pull_quote");
var NumberPullQuote = require("./number_pull_quote");
var SocialTimeSeries = require("./social_time_series");
var decorateWith = require("../util/decorate_with");
var colors = require("../util/colors");

var Social = function(app, repo) {
  this._app = app;
  this._repo = repo;
};

Social.prototype = {
  
  _template: fs.readFileSync(__dirname + "/../../../templates/social.mustache", "utf8"),
  _topSourcesSelector: ".top_traffic_sources_container",
  _mostReferredSelector: ".most_shared_datasets_container",
  _pullquoteContainer: ".pullquote_container",
  _numberQuoteContainer: ".numberquote_container",
  _socialTimeseriesContainer: ".social_timeseries_container",
  _topN : 4,

  render: function(selector) {
    render.toSelector(this._template, selector);
    
    var sourceStatistics = this._repo.getStatistic("Social sources");
    var mostReferred = this._repo.getMostReferred('All');
    var totalVisits = this._repo.getStatistic("Totals").series("Total visits");
    var sharedProportion = sourceStatistics.sum().asProportionOfSeries(totalVisits);

    var topSources = new TopTrafficSources(this._app, sourceStatistics.topN(this._topN, true));
    topSources.render(selector + " " + this._topSourcesSelector);
    
    var mostShared = new MostShared(this._app, this._repo, mostReferred);
    mostShared.render(selector + " " + this._mostReferredSelector);
    
    var pullQuote = new PercentagePullQuote(sharedProportion.last().value(), "of visits in the last month come from links on social media. That's: ");
    pullQuote.render(selector + " " + this._pullquoteContainer);

    var numberQuote = new NumberPullQuote(sourceStatistics.sum().last().value(), "visits in total.");
    numberQuote.render(selector + " " + this._numberQuoteContainer);

   
    sharedProportion = decorateWith(sharedProportion, {
      color: function() {
        return colors[2]; 
      } 
    });
    var timeseries = new SocialTimeSeries(this._app, this._repo, sharedProportion);
    timeseries.render(selector + " " + this._socialTimeseriesContainer);
  }
};

module.exports = Social;
