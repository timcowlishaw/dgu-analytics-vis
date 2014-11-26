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
  this._markers = {};
  this._app.registerMessageHandler("countrySelected", bind(this, this._onCountrySelected));
};

WorldMap.prototype = {

  _maxRadius: 100,

  render: function(selector) {
    var element = slick.find(selector);
    this._map = L.map(element, { attributionControl: false }); 
    this._map.setView([23, 18], 2);
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/timcowlishaw.1aefef48/{z}/{x}/{y}.png').addTo(this._map); 
    this._statistics.last().without("United Kingdom").proportionally().sqrt().each(bind(this, function(name, statistic) {
      var country = this._repo.getCountry(name);
      if(country) {
        var radius = statistic.value() * this._maxRadius;
        var marker = L.circleMarker(
          [country.latitude(), country.longitude()], 
          {radius: radius, color: colors.base }
        );
        this._markers[name] = marker;
        marker.addEventListener("click", bind(this, function() {
          this._onMarkerClick(name);
        }));
        marker.addTo(this._map);
        
      }
    }));
  },

  _onMarkerClick: function(name) {
    this._app.sendMessage("countrySelected", name);
  },

  _onCountrySelected: function(country) {
    this._map.eachLayer(bind(this, function(marker) {
      if(_.contains(_.values(this._markers),marker)) this._map.removeLayer(marker); 
    }));
    if(country) {
      var marker = this._markers[country];
      this._map.addLayer(marker);
    } else {
      _.each(_.values(this._markers), bind(this, function(marker) {
        this._map.addLayer(marker); 
      }));
    }
  },
};

module.exports = WorldMap;
