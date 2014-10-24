"use strict";

module.exports = function(object, listener) {
  return function() {
    return listener.apply(object, arguments);
  };
};

