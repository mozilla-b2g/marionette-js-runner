suite('runtime/host', function() {
  var mock = mockProcessSend(),
      Host = require('../../lib/runtime/host').Host;

  var subject,
      hostId = 'magic_number';

  setup(function(done) {
    mock.sent.on('createHost', function(reqId) {
      process.emit('message', ['response', reqId, null, hostId]);
    });

    Host.create(function(err, host) {
      if (err) return done(err);
      subject = host;
      done();
    });
  });

  test('._id', function() {
    assert.equal(subject._id, hostId);
  });

  test('#stop', function(done) {
    mock.sent.on('stopHost', function(reqId, gotId) {
      assert.equal(gotId, hostId);
      done();
    });

    subject.stop(function() {});
  });

  test('#restart', function(done) {
    mock.sent.on('restartHost', function(reqId, gotId) {
      assert.equal(gotId, hostId);
      done();
    });

    subject.restart(function() {});
  });

});
