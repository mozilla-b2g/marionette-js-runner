suite('childruntime', function() {

  // child runtime executes inside of the typical mocha test runtime
  // and exposes globals of its own typically.
  var runtime = require('../lib/childruntime'),
      EventEmitter = require('events').EventEmitter;

  var sent,
      originalSend;

  // spy on process.send
  setup(function() {
    originalSend = process.send;
    sent = new EventEmitter();

    process.send = function(event) {
      if (Array.isArray(event) && typeof event[0] === 'string') {
        sent.emit.apply(sent, event);
      }

      // if there is a send method use it.
      if (originalSend) {
        originalSend.apply(this, arguments);
      }
    };
  });

  teardown(function() {
    process.send = originalSend;
  });

  suite('Requests', function() {
    var subject = runtime.Requests;

    test('emit', function(done) {
      var expectedValue = 1;

      sent.once('do stuff', function(responseId) {
        console.log('!!', responseId);
      });

      subject.emit('do stuff', function(gotValue) {
        assert.equal(gotValue, expectedValue);
        done();
      });
    });
  });

});
