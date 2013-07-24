var Consumer = require('mocha-json-proxy/consumer'),
    commander = require('commander'),
    fsPath = require('path'),
    reporter = require('mocha-json-proxy/reporter'),
    fork = require('child_process').fork,
    debug = require('debug')('marionette-js-runner:childrunner');


var MOCHA_BINARY = '/bin/_mocha';

function hostProxyMethod(proxyMethod) {
  return function(hostId, callback) {
    var host = this._hosts[hostId];
    if (!host)
      return callback(new Error('no such host with id:' + hostId));

    host[proxyMethod](callback);
  }
}

/**
 * Mocha child instance- responsible for managing hosts (in
 * this process) and then spawning a separate process for the
 * mocha tests to run in...
 *
 *
 *    var child = new Child({
 *      argv: process.argv.slice(1)
 *    });
 *
 *    var childProcess = child.run();
 *
 * @param {Options} options for process.
 * @param {Array} options.argv argv options for mocha.
 * @param {Host} options.host host class (not instance).
 */
function ChildRunner(options) {
  if (!options.argv)
    throw new Error('argv is required');

  //XXX: turn this back on
  //if (!options.host || typeof options.host !== 'function')
    //throw new Error('host is required');

  this.argv = options.argv;
  this.host = options.host;

  this._nextHostId = 1;
  this._hosts = {};

  // path to actual mocha binary
  this._mocha =
    fsPath.join(fsPath.dirname(require.resolve('mocha')), MOCHA_BINARY);
}

ChildRunner.prototype = {
  /**
   * Next host id
   *
   * @type Number
   */
  _nextHostId: 1,

  /**
   * All active hosts on child.
   *
   * @type {Object}
   */
  _hosts: null,

  /**
   * mocha-json-proxy consumer instance.
   *
   * @type {Consumer} runner.
   */
  runner: null,

  _buildIPCCallback: function(uniqueId) {
    var child = this.process;
    return function() {
      return child.send(['response', uniqueId].concat(arguments));
    }
  },

  /**
   * Handles an IPC request.
   *
   * Usual payload looks like this:
   *
   *    ['name of event', requestId, ...]
   *
   * All responses take the following form:
   *
   *    ['response', requestId, ...]
   *
   * @param {Array} event data.
   */
  handleIPC: function(event) {
    var method = event.shift();

    // if this is not an available method abort.
    if (!(method in this))
      return;

    var requestId = event.shift(),
        callback = this._buildIPCCallback(requestId);

    debug('invoke ipc method', method, requestId, event);

    // invoke method with special "callback" which will emit data to the child
    // process.
    this[method].apply(this, event.concat(callback));
  },

  /**
   * Fired when the child process requests a host.
   *
   * @param {Function} callback [Error err, hostId]
   */
  createHost: function(callback) {
    var host = new this.host(),
        hostId = this._nextHostId++;

    this._hosts[hostId] = host;
    host.start(function(err, port) {
      if (err) return callback(err);
      callback(hostId, port);
    });
  },

  restartHost: hostProxyMethod('restart'),

  stopHost: hostProxyMethod('stop'),

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

    // must come after constructing the consumer otherwise messages
    // are sent before the consumer is ready to receive them.
    this.process.on('message', this.handleIPC.bind(this));
  }
};

module.exports.ChildRunner = ChildRunner;
