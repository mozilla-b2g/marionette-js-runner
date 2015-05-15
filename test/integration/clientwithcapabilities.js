marionette('client with capabilities', function() {
  // create a client and set desired capabilities.
  var client = marionette.client({
    desiredCapabilities: { desiredCapability: true }
  });

  test('test capabilities', function(done) {
    client.sessionCapabilities(function(err, capabilities) {
      // Capabilities are set
      assert.ok(capabilities.desiredCapability);
      done();
    });
  });
});
