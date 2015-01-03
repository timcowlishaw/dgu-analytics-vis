"use strict";
var render = require("../util/render");
var fs = require("fs");

var NumberPullQuote = function(value, text, preText) {
  this._value = value;
  this._text = text;
  this._preText = preText;
};

NumberPullQuote.prototype = {

  _template: fs.readFileSync(__dirname + "/../../../templates/number_pull_quote.mustache", "utf8"),

  render : function(selector) {
    render.toSelector(this._template, selector, {
      pre_text: this._preText,
      number: this._value.toLocaleString(),
      text: this._text  
    }); 
  }
};

module.exports = NumberPullQuote;
  
