var domready = require("domready");
var dgua = require("./dgua");
var slick = require("slick");
domready(function() {
  if(slick.find("#dgu-analytics")) {
    var application = new dgua.Application("#dgu-analytics");
    application.init();
  }
});
