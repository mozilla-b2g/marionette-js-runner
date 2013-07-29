/**
 * @fileoverview This file is included in every single test run from
 *               marionette-mocha. It acts as a place to expose logic
 *               needed to write the tests.
 */
var HostManager = require('./runtime/hostmanager').HostManager;

/** expose marionette */
global.marionette = require('./runtime/marionette').marionette;

var manager = global.marionette._manager = new HostManager();

// expose a public api
global.marionette.client = manager.createHost.bind(manager);
global.marionette.plugin = manager.addPlugin.bind(manager);
