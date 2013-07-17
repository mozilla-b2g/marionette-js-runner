suite('mocha child', function() {
  var Child = require('../../lib/mocha/child').Child;

  function aggregateOutput(childProcess) {
    var result = {
      stderr: '',
      stdout: ''
    };

    childProcess.stderr.on('data', function(input) {
      result.stderr += input.toString();
    });

    childProcess.stdout.on('data', function(input) {
      result.stdout += input.toString();
    });

    return result;
  }

  function waitForProcess(child, done) {
    var results = aggregateOutput(child);
    child.on('exit', function() {
      done();
    });

    return results;
  }

  suite('parse argv', function() {
    test('no reporter', function() {
      var subject = new Child(['--ui', 'tdd']);
      
    });
  });

  suite('compare with mocha run', function() {
    return;
    var expectedOut;
    var out;
    var argv = [__dirname + '/fixtures/test'];

    // setup mocha
    setup(function(done) {
      var child = spawnMocha(argv);
      expectedOut = waitForProcess(child, done);
    });

    // setup the child class
    setup(function(done) {
      var child = new Child(argv);
      out = waitForProcess(child.spawn(), done);
    });

    test('stdout', function() {
      assert.equal(expectedOut.stdout, out.stdout);
    });

    test('stderr', function() {
      assert.equal(expectedOut.stderr, out.stderr);
    });

  });
});
