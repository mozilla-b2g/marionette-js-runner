var Consumer = require('mocha-json-proxy/consumer'),
    commander = require('commander'),
    fsPath = require('path'),
    reporter = require('mocha-json-proxy/reporter'),
    fork = require('child_process').fork;


var MOCHA_BINARY = '/bin/_mocha';

/**
 * Mocha child instance- responsible for managing hosts (in
 * this process) and then spawning a separate process for the
 * mocha tests to run in...
 *
 *
 *    var child = new Child(process.argv.slice(1));
 *    var childProcess = child.run();
 *
 * @param {Array} argv for process.
 */
function ChildRunner(argv) {
  this.argv = argv;

  // path to actual mocha binary
  this._mocha =
    fsPath.join(fsPath.dirname(require.resolve('mocha')), MOCHA_BINARY);
}

ChildRunner.prototype = {
  /**
   * mocha-json-proxy consumer instance.
   *
   * @type {Consumer} runner.
   */
  runner: null,

  /**
   * Spawn the process for the mocha child runner.
   *
   * @return {ChildProcess}.
   */
  spawn: function() {
    // override the reporter to always use the json proxy.
    var argv = this.argv.concat(['--reporter', 'mocha-json-proxy/reporter']);
    var options = {
      env: {},
      // silent is similar to stdio: ['pipe', 'pipe'] + an ipc channel (send).
      silent: true
    };

    // turn on the fork options so we get ipc messages.
    options.env[reporter.FORK_ENV] = 1;

    this.process = fork(this._mocha, argv, options);
    this.runner = new Consumer(this.process);
  }
};

module.exports.ChildRunner = ChildRunner;
