suite('mocha child', function() {
  var subject;
  var Parent =
    require('../lib/parentrunner').ParentRunner;

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
