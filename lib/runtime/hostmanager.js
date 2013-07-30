var Host = require('./host').Host,
    Marionette = require('marionette-client'),
    debug = require('debug')('marionette-js-runner:runtime/hostmanager');

function HostManager() {}

HostManager.prototype = {
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

    // create the host
    suiteSetup(function(done) {
      Host.create(profile, function(err, instance) {
        host = instance;
        done(err);
      });
    });

    setup(function(done) {
      var driverInstance = new driver({
        port: host.port,
        // XXX: make configurable
        connectionTimeout: 10000
      });

      driverInstance.connect(function(err) {
        if (err) {
          done(err);
          return;
        }
        client.resetWithDriver(driverInstance);
        client.startSession(done);
      }.bind(this));
    });

    // turn off the client
    teardown(function(done) {
      client.deleteSession(done);
    });

    // restart between tests
    teardown(function(done) {
      host.restart(profile, done);
    });

    // stop when complete
    suiteTeardown(function(done) {
      host.stop(done);
    });

    return client;
  }

};

// expose host manager.
module.exports.HostManager = HostManager;
