"use strict";

var _ = require("underscore");
var Promise = require("bluebird");

var promises = {
  fanIn : function(promises, callback) {
    _.reduce(promises, function(next, promise) {
      return new Promise(function(resolve) {
        promise.then(function(x) {
          next.then(function(xs) {
            resolve(xs.concat([x])); 
          });
        });
      });
    }, new Promise(function(resolve) { resolve([]); })).then(callback);
  }
};

module.exports = promises;
