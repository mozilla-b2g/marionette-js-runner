var Consumer = require('mocha-json-proxy/consumer'),
    fsPath = require('path'),
    reporter = require('mocha-json-proxy/reporter'),
    fork = require('child_process').fork,
    emptyPort = require('empty-port'),
    debug = require('debug')('marionette-js-runner:childrunner');

// module module directory
var MOCHA_PATH = fsPath.dirname(require.resolve('mocha'));
var MOCHA_BINARY = fsPath.join(MOCHA_PATH, 'bin', '_mocha');
var STARTING_PORT = 60030;
var MARIONETTE_ENABLED_PREF = 'marionette.defaultPrefs.enabled';
var MARIONETTE_PORT_PREF = 'marionette.defaultPrefs.port';

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
 * Options
 *  - (Array) argv: argv for mocha.
 *  - (Host) host: class (not instance).
 *
 * @param {Options} options for process.
 */
function ChildRunner(options) {
  if (!options.argv)
    throw new Error('argv is required');

  if (typeof options.host !== 'function')
    throw new Error('host is required');

  this.argv = options.argv;
  this.hostClass = options.host;
  this.profileBuilderClass = options.profileBuilder;

  // base details used in every profile
  this.profileBase = options.profileBase;

  this._nextRemoteId = 1;
  this._remotes = {};
}

ChildRunner.prototype = {
  /**
   * Next host id to use. Number will increase monotonically.
   *
   * @type Number
   */
  _nextRemoteId: 1,

  /**
   * Remote objects related to a given remote id.
   * Typically in the form of:
   *
   *    {
   *      id: { id: id, host: host, profileBuilder: builder }
   *    }
   *
   *
   * @type {Object}
   */
  _remotes: null,

  /**
   * mocha-json-proxy consumer instance.
   *
   * @type {Consumer} runner.
   */
  runner: null,

  /**
   * @param {Object} remote details.
   * @return {Object} properties for host.
   */
  _remoteDetails: function(remote) {
    return {
      metadata: this.hostClass.metadata,
      port: remote.port,
      id: remote.id
    };
  },

  /**
   * Creates a wrapper function around a IPC response.
   *
   * @param {Stirng} uniqueId for IPC request.
   * @return {Function} callback like function.
   */
  _buildIPCCallback: function(uniqueId) {
    var child = this.process;
    return function() {
      var args = Array.prototype.slice.call(arguments);
      return child.send(['response', uniqueId].concat(args));
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
      // XXX: in the future should send some error for missing IPC methods?
      return debug('missing IPC method', method);

    var requestId = event.shift(),
        callback = this._buildIPCCallback(requestId);

    debug('invoke ipc method', method, requestId, event);

    // invoke method with special "callback" which will emit data to the child
    // process.
    this[method].apply(this, event.concat(callback));
  },

  /**
   * Generates the default set of profile options.
   *
   * @param {Number} port for marionette connection.
   * @param {Object} options for build.
   * @return {Object} full configuration for build.
   */
  profileOptions: function(port, options) {
    options = options || {};
    options.prefs = options.prefs || {};

    options.prefs[MARIONETTE_ENABLED_PREF] = true;
    options.prefs[MARIONETTE_PORT_PREF] = port;

    return options;
  },

  /**
   * Attempts to find a remote by its index or throw.
   *
   * @return {Object} remote.
   */
  _findRemote: function(id) {
    var remote = this._remotes[id];
    if (!remote) {
      throw new Error('invalid host lookup: "' + id + '"');
    }

    return remote;
  },

  /**
   * Finds an open port and generates a profile then invokes the given
   * profile builder / host methods.
   *
   * @param {String} builderMethod method to invoke on profile builder.
   * @param {String} hostMethod method to invoke on host.
   * @param {Object} remote which is target of build.
   * @param {Function} callback to invoke once calls are complete.
   */
  _buildRemote: function(builderMethod, 
                         hostMethod,
                         remote, 
                         callback) {

    // find an open port to use.
    emptyPort({ startPort: STARTING_PORT }, function(err, port) {
      if (err) return callback(err);
      // set or update the port
      remote.port = port;

      // XXX: allow specifying profile overrides here
      var profileOptions = this.profileOptions(port);
      var builder = remote.profileBuilder;
      var host = remote.host;

      // create the profile
      builder[builderMethod](profileOptions, function(err, profile) {
        if (err) return callback(err);
        // start the host
        host[hostMethod](profile, { port: port }, function(err) {
          if (err) return callback(err);

          // update the child process
          callback(null, this._remoteDetails(remote));
        }.bind(this));
      }.bind(this));

    }.bind(this));
  },

  /**
   * Fired when the child process requests a host.
   *
   * @param {Function} callback [Error err, remoteId].
   */
  createHost: function(callback) {
    var id = ++this._nextRemoteId;

    // XXX: allow passing default options to host and profile builder.
    var host = new this.hostClass();
    var builder = new this.profileBuilderClass(this.profileBase);

    // save copy of records in this process to be referenced later.
    var remote = this._remotes[id] = {
      id: id,
      host: host,
      profileBuilder: builder
    };

    this._buildRemote(
      'build', // profile method
      'start', // host method,
      remote,
      callback
    );
  },

  /**
   * Restarts a single host by id.
   *
   * @param {Number} remoteId unique id for single host in this child.
   * @param {Function} callback [Error err].
   */
  restartHost: function(id, callback) {
    var remote = this._findRemote(id);
    this.stopHost(id, function(err) {
      if (err) return callback(err);
      this._buildRemote(
        'build', // profile method
        'start', // host method,
        remote,
        callback
      );
    }.bind(this));
  },

  /**
   * Stops a single host by id.
   *
   * @param {Number} remoteId unique id for single host in this child.
   * @param {Function} callback [Error err].
   */
  stopHost: function(id, callback) {
    var remote = this._findRemote(id);
    remote.host.stop(function(err) {
      if (err) return callback(err);
      remote.profileBuilder.destroy(callback);
    });
  },

  /**
   * Spawn the process for the mocha child runner.
   */
  spawn: function() {
    // runtime is technically executed as a test so requires will not have any
    // of this functionality.
    var argv = [
      __dirname + '/runtime.js'
    ].concat(this.argv);

    // reporter must come after everything else to override a previous reporter
    argv = argv.concat(
      ['--reporter', 'mocha-json-proxy/reporter']
    );

    // encode the metadata in base64 + json
    var metadata =
      new Buffer(JSON.stringify(this.hostClass.metadata)).toString('base64');

    // pass all environment variables to the child...
    var env = {};
    for (var key in process.env) {
      env[key] = process.env[key];
    }
    env.CHILD_METADATA = metadata;

    var options = {
      env: env,
      // silent is similar to stdio: ['pipe', 'pipe'] + an ipc channel (send).
      silent: true
    };

    // turn on the fork options so we get ipc messages.
    options.env[reporter.FORK_ENV] = 1;

    this.process = fork(MOCHA_BINARY, argv, options);
    this.runner = new Consumer(this.process);

    // must come after constructing the consumer otherwise messages
    // are sent before the consumer is ready to receive them.
    this.process.on('message', this.handleIPC.bind(this));
    this.process.on('exit', function() {
      this.process = null;
    }.bind(this));
  }
};

module.exports.ChildRunner = ChildRunner;
