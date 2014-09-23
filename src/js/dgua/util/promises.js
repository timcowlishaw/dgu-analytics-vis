"use strict";

var _ = require("underscore");

module.exports = {
  fanIn : function(promises, callback) {
    _.reduce(promises, function(next, promise) {
      return new Promise(function(resolve, reject) {
        promise.then(function(x) {
          next.then(function(xs) {
            resolve(xs.concat([x])); 
          });
        });
      });
    }, new Promise(function(resolve, reject) { resolve([]); })).then(callback);
  }
};
