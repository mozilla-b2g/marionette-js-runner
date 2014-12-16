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

    // rpc interfaces created...
    var host, session, profileBuilder;

    var client = new Marionette.Client(null, { lazy: true });
    var plugins = this.plugins;

    suiteSetup(function() {
      var ctx = this;
      return this.runner.createHost().then(function(_host) {
        host = _host;
        // client is tacked on mostly for error handling.
        host.client = client;
        ctx.hosts.push(host);
      });
    });

    setup(function() {
      var ctx = this;
      var driverInstance;
      var pluginReferences = {};
      var createdProfileConfig;

      return this.runner.createProfile(profile)
        .then(function(_profileBuilder) {
          profileBuilder = _profileBuilder;
          return profileBuilder.getConfig();
        })
        .then(function(_createdProfileConfig) {
          host.profileConfig = createdProfileConfig = _createdProfileConfig;
          return host.createSession(
            createdProfileConfig, profile.hostOptions
          );
        })
        .then(function(_session) {
          session = _session;
          host.session = session;

          // build object with all plugins
          plugins.forEach(function(plugin) {
            pluginReferences[plugin.name] = {
              plugin: plugin.plugin,
              options: plugin.options
            };
          });

          driverInstance = new driver({
            port: createdProfileConfig.port,
            // XXX: make configurable
            connectionTimeout: (60 * 1000) * 3 // 3 minutes
          });

          return Promise.denodeify(
            driverInstance.connect.bind(driverInstance)
          )();
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
      var deleteSession = Promise.denodeify(client.deleteSession.bind(client));

      return deleteSession().
        then(function() {
          return session.destroy();
        });
    });

    suiteTeardown(function() {
      return host.destroy();
    });

    return client;
  }

};

// expose host manager.
module.exports.HostManager = HostManager;
