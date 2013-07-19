suite('mocha child', function() {
  var Parent = require('../../lib/mocha/parent').Parent;
  var subject;

  suite('initialization', function() {
    var argv = [];
    setup(function() {
      subject = new Parent(argv);
    });

    test('.argv', function() {
      assert.equal(subject.argv, argv);
    });
  });

});
