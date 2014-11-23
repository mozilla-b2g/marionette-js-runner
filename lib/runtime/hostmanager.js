var debug = require('debug')('marionette-js-runner:hostmanager');

var Promise = require('promise');
var Marionette = require('marionette-client');

/**
 * @constructor
 */
function HostManager() {
  this.plugins = [];
}


HostManager.prototype = {
  /**
   * Adds a plugin to the stack of plugins.
   *
   * @param {String} name of plugin.
   * @param {Function} plugin function to invoke.
   * @param {Object} options for plugin.
   */
  addPlugin: function(name, plugin, options) {
    var plugins = this.plugins;
    suiteSetup(function() {
      plugins.push({ plugin: plugin, name: name, options: options });
    });

    suiteTeardown(function() {
      plugins.pop();
    });
  },

  /**
   * Setup a host inside of the current execution context.
   *
   * @param {Object} profile settings for host.
   * @param {Object} driver for marionette.
   * @return {Marionette.Client} instance of a client.
   */
  createHost: function(profile, driver) {
    profile = profile || {};
    driver = driver || Marionette.Drivers.TcpSync;

    debug('create host', profile);

    // so we don't run the setup blocks multiple times.
    var client = new Marionette.Client(null, { lazy: true });
    var host;
    var plugins = this.plugins;

    suiteSetup(function() {
      return this.runner.createHost().then(function(_host) {
        host = _host;
      });
    });

    setup(function() {
      var ctx = this;
      var driverInstance;
      var pluginReferences = {};
      return host.createSession()
        .then(function(session) {
          ctx.session = session;

          // build object with all plugins
          plugins.forEach(function(plugin) {
            pluginReferences[plugin.name] = {
              plugin: plugin.plugin,
              options: plugin.options
            };
          });

          driverInstance = new driver({
            port: 2828, // XXX: Fix this
            // XXX: make configurable
            connectionTimeout: (60 * 1000) * 3 // 3 minutes
          });

          return Promise.denodeify(driverInstance.connect.bind(driverInstance))();
        })
        .then(function() {
          client.resetWithDriver(driverInstance);

          for (var name in pluginReferences) {
            debug('add plugin', name);
            // remove old plugin reference
            delete client[name];

            // setup new plugin
            client.plugin(
              name,
              pluginReferences[name].plugin,
              pluginReferences[name].options
            );
          }

          return Promise.denodeify(client.startSession.bind(client))();
        });
    });

    // turn off the client
    teardown(function() {
      var ctx = this;
      var deleteSession = Promise.denodeify(client.deleteSession.bind(client));

      return deleteSession().
        then(function() {
          return ctx.session.destroy();
        });
    });

    return client;
  }

};

// expose host manager.
module.exports.HostManager = HostManager;
