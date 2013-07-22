var Host = require('./runtime/host').Host;

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
  this.defaultHost.stop(done);
});
