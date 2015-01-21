var assert = require('chai').assert;

marionette('tdd retry', function() {
  var x = 0;

  var client = marionette.client();

  suiteSetup(function() {
    assert.operator(x++, '>', 0);
  });

  suiteTeardown(function() {
    assert.operator(x++, '>', 8);
  });

  setup(function() {
    assert.operator(x++, '>', 2);
  });

  teardown(function() {
    assert.operator(x++, '>', 6);
  });

  test('should eventually pass', function() {
    assert.operator(x++, '>', 4);
  });
});
