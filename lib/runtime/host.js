var Requests = require('./requests').Requests;
var errorIPC = require('../error_ipc');

function ipcCallback(callback) {
  return function() {
    args = Array.prototype.slice.call(arguments);
    args[0] = errorIPC.deserialize(args[0]);
    return callback.apply(this, args);
  };
}

/**
 * Proxy implementation of the "host"
 *
 * @param {Object} meta some configuration for host.
 */
function Host(meta) {
  this.updateMeta(meta);
}

/**
 * Request a new host from the parent process.
 *
 * @param {Object} profile for this host.
 * @param {Function} callback [Error err, Host host].
 */
Host.create = function(profile, callback) {
  callback = ipcCallback(callback);
  Requests.emit('createHost', profile, function(err, meta) {
    if (err) return callback(err);
    callback(null, new Host(meta));
  });
};

Host.prototype = {

  /**
  Send an error to the parent process to handle.
  */
  handleError: function(error, callback) {
    Requests.emit(
      'handleError', this.id, errorIPC.serialize(error), ipcCallback(callback)
    );
  },

  /**
   * Proxies a stop call to the main process.
   *
   * @param {Function} callback [Error err].
   */
  stop: function(callback) {
    Requests.emit('stopHost', this.id, ipcCallback(callback));
  },

  /**
   * Tears down host.
   *
   * @param {Function} callback [Error err]
   */
  teardown: function(callback) {
    Requests.emit('teardownHost', this.id, ipcCallback(callback));
  },

  /**
   * Updates the properties of this host with metadata from the main process.
   *
   * @param {Object} meta to update instance with.
   */
  updateMeta: function(meta) {
    for (var key in meta) {
      this[key] = meta[key];
    }
  },

  /**
   * Restarts host.
   *
   * @param {Object} profile for this host.
   * @param {Function} callback [Error err].
   */
  restart: function(profile, callback) {
    callback = ipcCallback(callback);
    Requests.emit('restartHost', this.id, profile, function(err, meta) {
      if (err) return callback(err);

      // update the values given by the main thread.
      this.updateMeta(meta);
      callback();
    }.bind(this));
  }
};

module.exports.Host = Host;
