/***
 * This file is mostly glue code between the smaller modules.
 *
 * Its really important to consider the ordering of the setup/teardown
 * method here as bad things can happen if the host is closed before the
 * marionette client is stopped.
 */


var Host = require('./runtime/host').Host;

/** expose marionette */
global.marionette = require('./runtime/marionette').marionette;

/** create default client */
var Marionette = require('marionette-client');

/** create default host **/

suiteSetup(function(done) {
  // create default host
  Host.create(function(err, host) {
    if (err) return done(err);
    this.defaultHost = host;
    done();
  }.bind(this));
});

setup(function(done) {
  if (this.disableClients)
     return done();

  var Driver =
    Marionette.Drivers[this.defaultMarionetteDriver || 'TcpSync'];

  var driver = new Driver({
    port: this.defaultHost.port,
    connectionTimeout: 10000
  });

  driver.connect(function(err) {
    if (err) return done(err);
    this.client = new Marionette.Client(driver);
    this.client.startSession(function() {
      done();
    });
  }.bind(this));
});

teardown(function(done) {
  if (this.disableClients)
    return;

  this.client.deleteSession(done);
});

teardown(function(done) {
  this.defaultHost.restart(done);
});

suiteTeardown(function(done) {
  this.defaultHost.stop(function(err) {
    done();
  });
});
