"use strict";

var render = require("../util/render");
var fs = require("fs");
var WorldMap = require("../components/world_map");
var Countries = function(app, repo) {
  this._app = app;
  this._repo = repo;
};

Countries.prototype = {
  _template: fs.readFileSync(__dirname + "/../../../templates/countries.mustache", "utf8"),

  _worldMapSelector: ".world_map_container",

  render : function(selector) {
    render.toSelector(this._template, selector);
    var statistics = this._repo.getStatistic("Country");
    var worldMap = new WorldMap(this._repo, statistics);
    worldMap.render(selector + " " + this._worldMapSelector);
  }
};

module.exports = Countries;
