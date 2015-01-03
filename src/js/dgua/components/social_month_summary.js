"use strict";

var fs = require("fs");
var render = require("../util/render");
var colors = require("../util/colors");
var decorateWith = require("../util/decorate_with");
var GroupPie = require("./group_pie");
var PercentagePullQuote = require("./percentage_pull_quote");
var GroupKeyWithPercentage = require("./group_key_with_percentage");

var SocialMonthSummary = function(app, repo, statistic) {
  this._app = app;
  this._repo = repo;
  this._statistic = statistic;
};

SocialMonthSummary.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/social_month_summary.mustache", "utf8"),
  _months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  _topN: 4,

  render: function(selector) {
    render.toSelector(this._template, selector, this._params());  
    var socialStats = this._repo.getStatistic("Social sources").at(this._statistic.time());
    var totalVisits = this._repo.getStatistic("Totals").series("Total visits").at(this._statistic.time());
    var sharedDatasets = this._repo.getMostReferred(this._statistic.period());
    var sharedProportion = socialStats.sum().proportionally(totalVisits.value());
    var sharedProportionGroup = sharedProportion.toProportionalGroup(1, "Referred traffic").map(function(s, k) {
      return decorateWith(s, {
        color: function() { return k == "Referred traffic" ? colors[2] : colors.neutral; } 
      });
    });

    var percentage = new PercentagePullQuote(sharedProportion.value(), "of visits came from links on social media.");
    percentage.render(selector + " " + ".quote");

    var pie = new GroupPie(sharedProportionGroup);
    pie.render(selector + " " + ".pie");
    

    var sources = new GroupKeyWithPercentage(socialStats.topN(this._topN));
    sources.render(selector + " " + ".sources");

    var datasets = new GroupKeyWithPercentage(sharedDatasets.topN(this._topN));
    datasets.render(selector + " " + ".datasets");
  },


  _params: function() {
    return {
      date: this._date()
    };
  },

  _date: function() {
    var date = new Date(this._statistic.time());
    return this._months[date.getMonth()] + " " + date.getFullYear();
  }
};

module.exports = SocialMonthSummary;
