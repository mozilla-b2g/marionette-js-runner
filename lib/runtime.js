/**
 * @fileoverview This file is mostly glue code between the smaller modules.
 */
var HostManager = require('./runtime/hostmanager').HostManager;

/** expose marionette */
global.marionette = require('./runtime/marionette').marionette;

var manager = global.marionette._manager = new HostManager();
manager.expose();

// expose a public api
global.marionette.client = manager.createHost.bind(manager);
