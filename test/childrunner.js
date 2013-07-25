suite('childrunner', function() {
  var Child =
    require('../lib/childrunner').ChildRunner;

  var Consumer = require('mocha-json-proxy/consumer');
  var EventEmitter = require('events').EventEmitter;

  function MockHost(options) {
    this.options = options;
  }

  MockHost.metadata = { host: 'mock' };

  MockHost.prototype = {
    start: function(callback) {
      process.nextTick(function() {
        this.port = Math.floor(Math.random() * 100);
        this.started = true;
        callback(null, this.port);
      }.bind(this));
    },

    stop: function(callback) {
      callback();
    },

    restart: function(callback) {
      callback();
    }
  };

  suite('#spawn', function() {
    var argv = [
      // test
      __dirname + '/fixtures/test',
      // Spec included to verify its ignored here
      '--reporter', 'Spec'
    ];

    var subject;

    setup(function() {
      subject = new Child({
        argv: argv,
        host: MockHost
      });

      subject.spawn();
    });

    test('.host', function() {
      assert.equal(subject.hostClass, MockHost);
    });

    test('.process', function() {
      assert.ok(subject.process);
    });

    test('process.stdout', function() {
      assert.ok(subject.process.stdout);
    });

    test('process.stderr', function() {
      assert.ok(subject.process.stderr);
    });

    test('.runner', function() {
      assert.ok(subject.runner instanceof Consumer);
    });

    test('emits end', function(done) {
      subject.runner.on('end', done);
    });
  });

  suite('ipc methods', function() {
    setup(function() {
      subject = new Child({
        argv: [__dirname + '/fixtures/noop'],
        host: MockHost
      });
      subject.spawn();
    });

    // wrap process.send
    var sent;
    setup(function() {
      var originalSend = subject.process.send;
      sent = new EventEmitter();
      subject.process.send = function(input) {
        // incoming payload: ['runner response', number, ...];
        if (Array.isArray(input) && input[0] === 'response') {
          var slice = input.slice(1);
          sent.emit.apply(sent, slice);
        }
        originalSend.apply(this, arguments);
      };
    });

    var host,
        hostId,
        meta;

    setup(function(done) {
      host = null;
      hostId = null;
      meta = null;

      sent.once(99, function(err, givenHostId, givenMeta) {
        hostId = givenHostId;
        host = subject._hosts[hostId];
        meta = givenMeta;
        done();
      });

      subject.process.emit('message', ['createHost', 99]);
    });

    test('#createHost', function() {
      assert.ok(host, 'has host');
      assert.ok(host.started, 'host started');
      assert.equal(host.port, meta.port, 'port');
      assert.deepEqual(meta.metadata, MockHost.metadata, 'metadata');
    });

    test('#restartHost', function(done) {
      // used to simulate port changes during a restart.
      var newPortValue = 666;

      host.restart = function(callback) {
        // change the port while restarting
        host.port = newPortValue;
        process.nextTick(callback);
      };

      sent.once(2, function(err, meta) {
        assert.equal(meta.port, host.port);
        done();
      });

      subject.process.emit('message', ['restartHost', 2, hostId]);
    });

    test('#stopHost', function(done) {
      var stopped = false;
      host.stop = function(callback) {
        stopped = true;
        process.nextTick(callback);
      };

      sent.once(3, function() {
        assert.ok(stopped);
        done();
      });

      subject.process.emit('message', ['stopHost', 3, hostId]);
    });

  });
});
