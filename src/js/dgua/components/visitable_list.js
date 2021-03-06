"use strict";

var bind = require("../util/bind");
var render = require("../util/render");
var fs = require("fs");
var dom = require("ampersand-dom");
var slick = require("slick");
var _ = require("underscore");
var events = require("dom-events");

var VisitableList = function(app, visitables, options) {
  if(!options) options = {};
  this._app = app;
  this._visitables = visitables;
  this._links = options.links === undefined ? true : options.links;
  this._showColor = options.color === undefined ? true : options.color;
  this._onClick = options.onClick;
  this._onHover = options.onHover;
  this._app.registerMessageHandler("highlightPublisher", bind(this, this._onHighlightPublisher));

};

VisitableList.prototype = {

  _itemTemplate: fs.readFileSync(__dirname + "/../../../templates/visitable_list_item.mustache", "utf8"),

  render: function(selector) {
    var container = slick.find(selector);
    this._element = document.createElement("ul");
    dom.addClass(this._element, "visitable_list");
    container.appendChild(this._element);
    this._renderVisitables();
  },

  _renderVisitables: function() {
    dom.text(this._element, "");
    _.each(this._visitables, bind(this, function(visitable) {
      var child = render.toNode(this._itemTemplate, this._templateParameters(visitable));
      this._element.appendChild(child);
      if(this._onHover) events.on(child, "mouseover", bind(this, function() { this._onHover(visitable); }));
      if(this._onClick) events.on(child, "click", bind(this, function(event) { event.preventDefault(); this._onClick(visitable); }));
    }));
  },

  _templateParameters: function(item) {
    return {
      url: this._links && item.url(),
      title: item.title(),
      subtitle: item.subtitle(),
      visits_proportion: (item.visitsProportion() * 100).toFixed(1) + "%",
      visits: item.visits(),
      views: item.views(),
      class_name: this._showColor || "no_color",
      color: item.color && item.color(),
      publisher_id: item.publisher().id()
    }; 
  },

  update: function(visitables) {
    this._visitables = visitables;
    this._renderVisitables();
  },

  _onHighlightPublisher: function(publisher) {
    var allElements = slick.search(".visitable", this._element);

    _.each(allElements, function(element) {
      dom.removeClass(element, "highlighted"); 
      dom.removeClass(element, "not-highlighted");
      if(publisher) {
        if(dom.hasClass(element, "publisher-" + publisher.id())) {
          dom.addClass(element,"highlighted");
        } else {
          dom.addClass(element,"not-highlighted");
        }
      }
    });
  },
};

module.exports = VisitableList;
