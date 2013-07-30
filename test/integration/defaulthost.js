suite('default host', function() {
  var lastPort;

  setup(function() {
    // sanity check to verify we are launching new clients each test.
    if (lastPort) {
      assert.ok(lastPort !== this.defaultHost.port, 'ports have changed');
    }
    lastPort = this.defaultHost.port;
  });

  test('is exposed', function() {
    assert.ok(this.defaultHost);
  });

  suite('connecting to host', function() {
    var Driver = require('marionette-client').Drivers.Tcp;

    test('connect', function(done) {
      var driver = new Driver({ port: this.defaultHost.port });
      driver.connect(done);
    });
  });
});
