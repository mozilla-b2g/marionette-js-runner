suite('childrunner', function() {
  var Child =
    require('../lib/childrunner').ChildRunner;

  var Consumer = require('mocha-json-proxy/consumer');

  suite('#spawn', function() {
    var argv = [
      // test
      __dirname + '/fixtures/test',
      // Spec included to verify its ignored here
      '--reporter', 'Spec'
    ];

    var subject;

    setup(function() {
      subject = new Child(argv);
      subject.spawn();
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
});
