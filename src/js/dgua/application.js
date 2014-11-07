"use strict";

var components = require("./components");
var data = require("./data");
var bind = require("./util/bind");
var _ = require("underscore");

var Application = function(selector, dataPath) {
  this._selector = selector;
  this._dataPath = dataPath;
  this._messageHandlers = {};
};

Application.prototype = {

  nToDisplay: 5,

  init: function() {
    data.Repository.loadDataSources(this._dataPath, bind(this, function(repo) {

      var countries = new components.Countries(this, repo);
      countries.render(this._selector);
      //var publishersDatasets = new components.PublishersDatasets(this, repo);
      //publishersDatasets.render(this._selector);
    }));
  },

  registerMessageHandler: function(messageName, handler) {
    if(!this._messageHandlers[messageName]) {
      this._messageHandlers[messageName] = [];
    }
    this._messageHandlers[messageName].push(handler);
  },

  sendMessage: function() {
    var payload = Array.prototype.slice.apply(arguments);
    var messageName = payload.shift();
    if(this._messageHandlers[messageName]) {
      this._messageHandlers[messageName].forEach(function(h) {
        h.apply(null, payload);
      });
    }
  },

  _topN: function(collection) {
    return _.first(collection, this._nToDisplay);
  }

};

module.exports = Application;
