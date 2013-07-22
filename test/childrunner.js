suite('childrunner', function() {
  var Child =
    require('../lib/childrunner').ChildRunner;

  var Consumer = require('mocha-json-proxy/consumer');
  var EventEmitter = require('events').EventEmitter;

  function MockHost(options) {
    this.options = options;
  }

  MockHost.prototype = {
    start: function(callback) {
      process.nextTick(function() {
        this.port = Math.floor(Math.random() * 100);
        this.started = true;
        callback(null, this.port);
      }.bind(this));
    },

    stop: function() {
    },

    restart: function() {
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
      assert.equal(subject.host, MockHost);
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
          sent.emit.apply(sent, input.slice(1));
        }
        originalSend.apply(this, arguments);
      };
    });

    var host,
        hostId,
        port;

    setup(function(done) {
      hostId = null;
      port = null;

      sent.once(1, function(event) {
        hostId = event[0];
        host = subject._hosts[hostId];
        port = event[1];
        done();
      });

      subject.process.emit('message', ['createHost', 1]);
    });

    test('#createHost', function() {
      assert.ok(host, 'has host');
      assert.ok(host.started, 'host started');
      assert.equal(host.port, port);
    });

    test('#restartHost', function(done) {
      var restarted = false;
      host.restart = function(callback) {
        restarted = true;
        process.nextTick(callback);
      };

      sent.once(2, function() {
        assert.ok(restarted);
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
