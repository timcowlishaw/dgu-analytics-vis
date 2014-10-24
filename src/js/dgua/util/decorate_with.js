"use strict";

var Decorator = function(underlying, additional) {
  for(var x in underlying) {
    this[x] = this._forward(underlying, underlying[x]);
  }

  for(var y in additional) {
    this[y] = this._forward(this, additional[y]);
  }
};

Decorator.prototype = {
  _forward: function(scope, method) {
    return function() {
      return method.apply(scope, arguments);
    };
  }
};

module.exports = function(underlying, additional) {
  return new Decorator(underlying, additional);
};
