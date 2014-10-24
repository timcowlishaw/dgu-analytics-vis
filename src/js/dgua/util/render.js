"use strict";

var mustache = require("mustache");
var slick = require("slick");

var toString = function(template, data) {
  if(!data) data = {};
  return mustache.render(template, data);
};

var toElement = function(template, element, data, append) {
  var rendered = toString(template, data);
  var content = append ? element.innerHTML + rendered : rendered;
  element.innerHTML = content;
  return element;
};

var toSelector = function(template, selector, data, append) {
  var element  = slick.find(selector);
  return toElement(template, element, data, append);
};

var toNode = function(template, data) {
  var string = toString(template, data);
  var temp = document.createElement("div");
  temp.innerHTML = string;
  return temp.firstChild;
};

module.exports = {
  toSelector: toSelector,
  toString: toString,
  toElement: toElement,
  toNode: toNode
};
