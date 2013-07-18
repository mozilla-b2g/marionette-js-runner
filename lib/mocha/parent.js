var Child = require('./child').Child;

function Parent(argv) {
  this.argv = argv;
}

Parent.prototype = {
  /**
   * Runs the mocha tests with a given reporter.
   *
   * @param {Mocha.reporters.Base} Reporter class (not instance).
   * @return {Mocha.reporters.Base} reporter _instance_.
   */
  run: function(Reporter) {
    // XXX: Eventually we want multiple children running.
    var child = new Child(this.argv);

    // spawn the process
    child.spawn();

    // since we deal with only one child right now just copy over the child's
    // process and runner.
    this.process = child.process;
    this.runner = child.runner;

    return new Reporter(child.runner);
  }
};

module.exports.Parent = Parent;
