"use strict";

var render = require("../util/render");
var fs = require("fs");
var _ = require("underscore");
var dom = require("ampersand-dom");
var style = require("dom-style");
var slick = require("slick");
var bind = require("../util/bind");
var events = require("dom-events");
var VisitableList = require("../components/visitable_list");
var VisitablePie = require("../components/visitable_pie");
var PublishersColumn = require("../components/publishers_column");
var ColorKey = require("../util/color_key");
var withVisitProportions = require("../util/with_visit_proportions");
var withOtherPublisher = require("../util/with_other_publisher");
var OtherPublisher = require("../models/other_publisher");
var PublishersDatasets = function(app, repo) {
  this._app = app;
  this._repo = repo;
 
  this._app.registerMessageHandler("selectPublisher", bind(this, this._onSelectPublisher));
};

PublishersDatasets.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/publishers_datasets.mustache", "utf8"),

  _publishersColumnSelector: ".publishers",
  _datasetsColumnSelector: ".datasets",
  _titleAreaSelector: ".title_area",
  _titleSelector: ".title",
  _backLinkSelector: ".back_link a",


  render: function(selector) {
    this._element = slick.find(selector);
    var allPublishers = this._repo.getPublishersByVisits();
    this._topPublishers = this._topN(allPublishers);
    this._otherPublisher = new OtherPublisher(_.difference(allPublishers, this._topPublishers));
    var publishers = this._topPublishers.concat(this._otherPublisher);

    publishers = withVisitProportions(
      publishers,
      this._repo.getTotalPublisherVisits()
    );

    var topDatasets = withVisitProportions(withOtherPublisher(
      this._topN(this._repo.getDatasetsByVisits()),
      this._topPublishers, this._otherPublisher
    ), this._repo.getTotalDatasetVisits());

    this._publisherColorKey = new ColorKey(_.map(publishers, function(p) { return p.id(); }));
    
    publishers = _.map(publishers, bind(this, function(publisher) {
      return this._publisherColorKey.withColor(publisher, publisher.id());
    }));

    this._topDatasets = _.map(topDatasets, bind(this, function(dataset) {
      return this._publisherColorKey.withColor(dataset, dataset.publisher().id());
    }));

    this._datasetsColumn = new VisitableList(this._app, this._topDatasets);
    
    var publishersList = new VisitableList(this._app, publishers, {
      links: false,
      onClick: bind(this, function(visitable) {
        this._app.sendMessage("selectPublisher", visitable.publisher());
      }),
      onHover: bind(this, function(visitable) {
        this._app.sendMessage("highlightPublisher", visitable.publisher());
      }) 
    });
    var publishersPie = new VisitablePie(this._app, publishers);
    this._publishersColumn = new PublishersColumn(this._app, publishersPie, publishersList); 

    render.toSelector(this._template, selector);

    this._publishersColumn.render(selector + "  " + this._publishersColumnSelector);
    this._datasetsColumn.render(selector + "  " + this._datasetsColumnSelector);
   
    var backLink = slick.find(this._backLinkSelector, this._element);
    events.on(backLink, "click", bind(this, function(event) {
      event.preventDefault();
      this._app.sendMessage("selectPublisher", null) ;
    }));
  },

  _onSelectPublisher: function(publisher) {
    var titleArea = slick.find(this._titleAreaSelector, this._element);
    if(publisher) {
      style(titleArea, { display: "block" });    
      var title = slick.find(this._titleSelector, this._element);
      dom.text(title, publisher.title());
      var n = publisher.title() == "Other" ? 10 : this._app.nToDisplay; 
      this._datasetsColumn.update(_.map(
        withOtherPublisher(this._topN(publisher.datasets(), n), this._topPublishers, this._otherPublisher),
        bind(this, function(dataset) {
          return this._publisherColorKey.withColor(dataset, dataset.publisher().id()); 
        })
      ));
    } else {
      style(titleArea, { display: "none" }); 
      this._datasetsColumn.update(this._topDatasets);
    }
  },

  _topN: function(collection, n) {
    return _.first(collection, n || this._app.nToDisplay);
  }
};
module.exports = PublishersDatasets;
