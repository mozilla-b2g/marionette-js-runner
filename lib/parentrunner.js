var Child = require('./childrunner').ChildRunner;

function ParentRunner(argv) {
  this.argv = argv;
}

ParentRunner.prototype = {
  /**
   * Runs the mocha tests with a given reporter.
   *
   * @param {Object} options for test run.
   * @param {Mocha.reporters.Base} options.reporter class (not instance).
   * @param {Host} options.host host class to use for tests.
   * @return {Mocha.reporters.Base} reporter _instance_.
   */
  run: function(options) {
    // XXX: Eventually we want multiple children running.
    var child = new Child({
      argv: this.argv,
      host: options.host
    });

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
