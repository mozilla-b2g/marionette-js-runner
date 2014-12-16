var assert = require('assert');
var assign = require('object-assign');
var debug = require('debug')('marionette-js-runner:childrunner');
var fork = require('child_process').fork;
var reporter = require('mocha-json-proxy/reporter');
var resolveModule = require('./resolvemodule');
var RPC = require('./rpc');
var uuid = require('uuid');

var Consumer = require('mocha-json-proxy/consumer');
var Logger = require('marionette-js-logger');
var Marionette = require('marionette-client');
var Promise = require('promise');

var emptyPort = Promise.denodeify(require('empty-port'));

// resolve module paths (required otherwise stuff breaks when the
// marionette-mocha binary is invoked outside of this package.
// Paths cannot be found via their relative module names. (mocha vs
// ./node_modules/mocha)
var MOCHA_BINARY = resolveModule('mocha', 'bin', '_mocha');
var PROXY_BINARY = resolveModule('mocha-json-proxy', 'reporter.js');

var STARTING_PORT = 60030;
var MARIONETTE_ENABLED_PREF = 'marionette.defaultPrefs.enabled';
var MARIONETTE_PORT_PREF = 'marionette.defaultPrefs.port';

function RemoteBuilder(builder, config) {
  this.builder = builder;
  this.destroy = Promise.denodeify(builder.destroy.bind(builder));
  this.config = config;
}

RemoteBuilder.prototype = {
  $rpc: { methods: ['destroy', 'getConfig'] },
  getConfig: function() {
    return Promise.resolve(this.config);
  }
};

function RemoteHost(runner, instance) {
  this.runner = runner;
  this.instance = instance;
  // marionette-js-logger interface (optional)
  this.logger = null;
}

RemoteHost.prototype = {
  $rpc: { methods: ['destroy', 'createSession'] },

  destroy: function() {
    // Cleanup logger if it was turned on...
    if (this.logger) {
      this.logger.close();
    }

    return this.instance.destroy().then(function() {
      // Removal _must_ be async otherwise this can mess up iteration (forEach).
      var idx = this.runner.hosts.indexOf(this);
      if (idx !== -1) {
        this.runner.hosts.splice(idx, 1);
      }
    }.bind(this));
  },

  createSession: function(profileConfig, options) {
    id = 'session-' + uuid.v4();
    options = assign({}, this.runner.host.options, options);

    var session = this.runner.host.module.createSession(
      this.instance,
      profileConfig.profile,
      options
    );

    if (!this.runner.verbose) {
      return session;
    }

    var driver = new Marionette.Drivers.Tcp({ port: profileConfig.port });
    var connect = Promise.denodeify(driver.connect.bind(driver));
    var client, startSession, deleteSession, result;
    return session.
      then(function(_result) {
        result = _result;
        return connect();
      })
      .then(function() {
        client = new Marionette.Client(driver);
        startSession = Promise.denodeify(client.startSession.bind(client));
        deleteSession = Promise.denodeify(client.deleteSession.bind(client));

        client.plugin('logger', Logger);

        return startSession();
      })
      .then(function() {
        this.logger = client.logger;
        return deleteSession();
      }.bind(this))
      .then(function() {
        return result;
      });
  }
};

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
 *  - (Function) Host: class
 *  - (Function) ProfileBuilder: class
 *  - (Object) profileBase: options to use for all builds.
 *
 * @constructor
 * @param {Options} options for process.
 */
function Runner(options) {
  assert(options.host, '.host is required');
  assert(options.hostLog, '.hostLog is required');
  assert(options.profileBuilder, '.profileBuilder is required');

  this.host = options.host;
  this.hostLog = options.hostLog;
  this.profileBuilder = options.profileBuilder;
  this.verbose = !!options.verbose;

  // base details used in every profile
  this.profileBase = options.profileBase;
  this.hosts = [];

  this._creatingHosts = [];
}


Runner.prototype = {
  createProfile: function(overrides) {
    var self = this;
    var config = {};
    var builder = new this.profileBuilder.constructor(this.profileBase);

    var build = Promise.denodeify(builder.build.bind(builder));

    return emptyPort({ startPort: STARTING_PORT })
      .then(function(port) {
        config.port = port;
        var profileOptions = self.profileOptions(port, overrides);
        return build(profileOptions);
      })
      .then(function(path) {
        config.profile = path;
        return new RemoteBuilder(builder, config);
      });
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
    options.hostOptions = options.hostOptions || {};
    options.hostOptions.port = port;

    options.prefs[MARIONETTE_ENABLED_PREF] = true;
    options.prefs[MARIONETTE_PORT_PREF] = port;

    return options;
  },

  createHost: function() {
    var id = 'host-' + uuid.v4();
    var promise = this.host.module.createHost().
      then(function(host) {
        if (host.log) {
          host.log.pipe(this.hostLog);
        }
        var remote = new RemoteHost(this, host);
        this.hosts.push(remote);
        this._creatingHosts.splice(this._creatingHosts.indexOf(promise), 1);
        return remote;
      }.bind(this));

    this._creatingHosts.push(promise);

    return promise;
  },

  destroy: function() {
    // To cleanly destroy we must wait until everything is in a known state
    // first. This will wait for everything to be properly started then cleanly
    // destroy the hosts.
    if (this._creatingHosts.length) {
      return Promise.all(this._creatingHosts).then(this.destroy.bind(this));
    }

    var hostsDestroy = this.hosts.map(function(host) {
      // Destroy will remove object from .hosts.
      return host.destroy();
    });

    // Immediately try to kill child process...
    this.process.kill();
    return Promise.all(hostsDestroy).then(function() {
      assert(
        Object.keys(this.hosts).length === 0,
        'all hosts removed.'
      );
    }.bind(this));
  },

  /**
   * Spawn the process for the mocha child runner.
   */
  spawn: function(argv) {
    // reporter must come after everything else to override a previous reporter
    argv = argv.concat(
      ['--reporter', PROXY_BINARY]
    );

    // pass all environment variables to the child...
    var env = {};
    for (var key in process.env) {
      env[key] = process.env[key];
    }

    var options = {
      env: env,
      // silent is similar to stdio: ['pipe', 'pipe'] + an ipc channel (send).
      silent: true
    };

    // turn on the fork options so we get ipc messages.
    options.env[reporter.FORK_ENV] = 1;

    this.process = fork(MOCHA_BINARY, argv, options);
    this.mochaRunnerProxy = new Consumer(this.process);
    this.rpc = new RPC(this.process.send.bind(this.process));

    this.rpc.register('runner', this);

    // must come after constructing the consumer otherwise messages
    // are sent before the consumer is ready to receive them.
    this.process.on('message', this.rpc.handle());
    this.process.on('exit', function() {
      this.process = null;
    }.bind(this));
  }
};

module.exports = Runner;
