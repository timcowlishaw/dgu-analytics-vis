"use strict";

var L = require("leaflet");
var slick = require("slick");
var bind = require("../util/bind");
var colors = require("../util/colors");
var _ = require("underscore");

var WorldMap = function(app, repo, statistics) {
  this._app = app;
  this._repo = repo;
  this._statistics = statistics; 
  this._markers = [];
};

WorldMap.prototype = {

  _maxRadius: 50,

  render: function(selector) {
    var element = slick.find(selector);
    this._map = L.map(element, { attributionControl: false }); 
    this._map.setView([23, 18], 2);
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/timcowlishaw.1aefef48/{z}/{x}/{y}.png').addTo(this._map); 
    this._statistics.last().without("United Kingdom").proportionally().each(bind(this, function(name, statistic) {
      var country = this._repo.getCountry(name);
      if(country) {
        var radius = statistic.value() * this._maxRadius;
        var marker = L.circleMarker(
          [country.latitude(), country.longitude()], 
          {radius: radius, color: colors.base }
        );
        this._markers.push(marker);
        marker.addEventListener("click", bind(this, function() {
          this._onMarkerClick(marker, name, statistic);
        }));
        marker.addTo(this._map);
        
      }
    }));
  },

  _onMarkerClick: function(marker, name, statistic) {
    _.each(_.difference(this._markers, [marker]), bind(this, function(m) {
      this._map.removeLayer(m); 
    }));
    this._app.sendMessage("countrySelected", name, statistic);
  },
};

module.exports = WorldMap;
