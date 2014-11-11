"use strict";

var L = require("leaflet");
var slick = require("slick");
var bind = require("../util/bind");
var colors = require("../util/colors");
var WorldMap = function(repo, statistics) {
  this._repo = repo;
  this._statistics = statistics; 
};

WorldMap.prototype = {

  _maxRadius: 33,

  render: function(selector) {
    var element = slick.find(selector);
    var map = L.map(element, { attributionControl: false }); 
    map.setView([51.505, -0.09], 2);
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/timcowlishaw.1aefef48/{z}/{x}/{y}.png').addTo(map); 
    this._statistics.last().without("United Kingdom").proportionally().each(bind(this, function(name, statistic) {
      var country = this._repo.getCountry(name);
      if(country) {
        var radius = statistic.value() * this._maxRadius;
        L.circleMarker(
          [country.latitude(), country.longitude()], 
          {radius: radius, color: colors.base }
        ).addTo(map);
      }
    }));
  }
};

module.exports = WorldMap;
