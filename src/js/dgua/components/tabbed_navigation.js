"use strict";

var render = require("../util/render");
var fs = require("fs");
var bind = require("../util/bind");
var slick = require("slick");
var dom = require("ampersand-dom");
var events = require("dom-events");
var _ = require("underscore");

var TabbedNavigation = function(app, tabs) {
  this._app = app;
  this._tabs = tabs;
};

TabbedNavigation.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/tabbed_navigation.mustache", "utf-8"),
 
  _contentSelector: ".tab_content",

  render: function(selector) {
    this._selector = selector;
    this._element = render.toSelector(this._template, selector, this._templateParams());
    this._selectTab(0);
    this._setupClickHandlers();
  },

  select: function(title) {
    var names = _.map(this._tabs, function(tab) { return tab[0]; });
    var n = _.indexOf(names, title);
    this._selectTab(n);
  },

  _templateParams: function() {
    return {
      tabs : _.map(this._tabs, function(tab, i) {
        return {
          title : tab[0],
          id : i
        }; 
      })
    }; 
  },

  _setupClickHandlers: function() {
    var tabs = slick.search(".tabs li", this._element);
    _.each(tabs, bind(this, function(tab, i) {
      events.on(tab, "click", bind(this, function(event) {
        event.preventDefault();
        this._selectTab(i);
      })); 
    }));
  },

  _selectTab: function(id) {
    var contentSection = slick.find(this._contentSelector, this._element);
    dom.text(contentSection, "");
    var tabs = slick.search(".tabs li", this._element);
    _.each(tabs, function(tab) {
      dom.removeClass(tab, "selected");
    });
    var selected = slick.find(".tabs li.tab-" + id, this._element);
    dom.addClass(selected, "selected");
    this._tabs[id][1](this._selector + " " + this._contentSelector);
  },
};

module.exports = TabbedNavigation;
