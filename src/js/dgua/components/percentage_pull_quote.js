"use strict";
var render = require("../util/render");
var fs = require("fs");

var PercentagePullQuote = function(value, text) {
  this._value = value;
  this._text = text;
};

PercentagePullQuote.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/percentage_pull_quote.mustache", "utf8"),

  render : function(selector) {
    render.toSelector(this._template, selector, {
      percentage: (this._value * 100).toFixed(2),
      text: this._text  
    }); 
  }
};

module.exports = PercentagePullQuote;
  
