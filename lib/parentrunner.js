var Children = require('./childrunner');

function ParentRunner(argv) {
  this.argv = argv;
}

ParentRunner.prototype = {
  /**
   * Array of all currently running children.
   *
   * @type {Array}
   */
  children: null,

  /**
   * Runs the mocha tests with a given reporter.
   *
   * # Options
   *  - (Mocha.reporters.Base) reporter: class (not instance) for test output.
   *  - (Host) host: host class (not instance) to be used in tests.
   *  - (ProfileBuilder) profileBuilder: profile builder class (not instance).
   *
   * @param {Object} options for test run.
   * @return {Mocha.reporters.Base} reporter _instance_.
   */
  run: function(options) {
    // create the list of children.
    this.children = [];

    // XXX: Eventually we want multiple children running.
    var child = new Children.ChildRunner({
      argv: this.argv,
      host: options.host,
      profileBase: options.profileBase,
      profileBuilder: options.profileBuilder
    });

    // keep track of all children- mostly for future use.
    this.children.push(child);

    // spawn the process
    child.spawn();

    // since we deal with only one child right now just copy over the child's
    // process and runner.
    this.process = child.process;
    this.runner = child.runner;

    return new options.reporter(child.runner);
  }
};

module.exports.ParentRunner = ParentRunner;
