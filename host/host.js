'use strict';

var spawn = require('child_process').spawn;
var uuid = require('uuid');
var request = require('./lib/request');

var EventEmitter = require('events').EventEmitter;
var Promise = require('promise');

var VENV = __dirname + '/../venv';

/**
Wrapper for spawning a python process which expects a venv with particular
packages. Same interface as spawn but overrides path and ensures certain env
variables are not set which conflict.

@param {String} bin path to binary to execute.
@param {Array} argv list of arguments.
@param {Object} opts options for node's spawn.
@return {ChildProcess}
*/
function spawnVirtualEnv(bin, argv, opts) {
  opts = opts || {};
  // Clone current environment variables...
  var env = opts.env = {};
  for (var key in process.env) env[key] = process.env[key];

  // Add binary wrappers to top most of the path...
  env['PATH'] = VENV + '/bin/:' + process.env.PATH;

  // Ensure we don't conflict with other wrappers or package managers.
  delete env['PYTHONHOME'];

  return spawn(bin, argv, opts);
}


function Host(socketPath, process) {
  this.process = process;
  this.socketPath = socketPath;

  EventEmitter.call(this);
}

Host.prototype = {
  __proto__: EventEmitter.prototype,

  destroy: function() {
    return new Promise(function(accept, reject) {
      this.process.kill();
      this.process.once('exit', accept);
    }.bind(this));
  },

  /**
  Issue a request to the hosts underlying python http server.
  */
  request: function(path, options) {
    return request(this.socketPath, path, options);
  }
};

Host.create = function() {
  return new Promise(function(accept, reject) {
    var socketPath = '/tmp/marionette-socket-host-' + uuid.v1() + '.sock';

    var pythonChild = spawnVirtualEnv('gaia-integration',
      ['--path=' + socketPath],
      { stdio: 'inherit' }
    );

    // Until we get ready start any errors will trigger the callback.
    pythonChild.on('error', reject);

    // Ensure if we exit for some reason during boot errors are reported...
    function earlyExitHandler() {
      // Ensure we don't call error callbck somehow...
      pythonChild.removeListener('error', reject);
      reject(
        new Error('Unexpected exit of gaia-integration during connect...')
      );
    }
    pythonChild.once('exit', earlyExitHandler);

    request(socketPath, '/connect')
      .then(function() {
        pythonChild.removeListener('exit', earlyExitHandler);
        pythonChild.removeListener('error', reject);

        return new Host(socketPath, pythonChild);
      })
      .then(accept)
      .catch(reject);

  }.bind(this));
};

module.exports = Host;
