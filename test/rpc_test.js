suite('rpc', function() {
  var RPC = require('../lib/rpc');
  var fork = require('child_process').fork;
  var assert = require('assert');

  var proc;
  suiteSetup(function() {
    proc = fork(__dirname + '/fixtures/rpc');
  });

  suiteTeardown(function() {
    proc.kill();
  });

  var subject, client;
  setup(function() {
    subject = new RPC(proc.send.bind(proc));
    client = subject.client('test', ['noArgs', 'args', 'error', 'getSelf']);
    proc.on('message', subject.handle());
  });

  test('noArgs', function() {
    return client.noArgs();
  });

  test('args', function() {
    return client.args(1, 2, 3, 4).then(function(result) {
      assert.deepEqual(result, [1, 2, 3, 4]);
    });
  });

  test('objects', function() {
    return client.getSelf().then(function(rpcObj) {
      return rpcObj.args('woot', 'bar')
    }).then(function(value) {
      assert.deepEqual(value, ['woot', 'bar']);
    });
  });

  test('error', function() {
    return client.error()
      .then(function() {
        process.nextTick(function() {
          throw new Error('must not resolve');
        });
      })
      .catch(function(err) {
        assert.equal(err.message, 'xfoo');
      });
  });


});
