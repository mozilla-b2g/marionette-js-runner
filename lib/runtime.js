var Host = require('./runtime/host').Host;

/** create default host **/

suiteSetup(function(done) {
  // create default host
  Host.create(function(err, host) {
    if (err) return done(err);
    this.defaultHost = host;
    done();
  }.bind(this));
});

teardown(function(done) {
  this.defaultHost.restart(done);
});

suiteTeardown(function(done) {
  this.defaultHost.stop(function(err) {
    done();
  });
});

/** create default client */
var Marionette = require('marionette-client');

setup(function(done) {
  var Driver =
    Marionette.Drivers[this.defaultMarionetteDriver || 'TcpSync'];

  var driver = new Driver({
    port: this.defaultHost.port,
    connectionTimeout: 10000
  });

  driver.connect(function(err) {
    if (err) return done(err);
    this.client = new Marionette.Client(driver);
    this.client.startSession(done);
  }.bind(this));
});

