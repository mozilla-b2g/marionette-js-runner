var Requests = require('./requests').Requests;

/**
 * Proxy implementation of the "host"
 */
function Host(hostId, meta) {
  this._id = hostId;
  this.updateMeta(meta);
}

/**
 * Request a new host from the parent process.
 *
 * @param {Function} callback [Error err, Host host].
 */
Host.create = function(callback) {
  Requests.emit('createHost', function(err, hostId, meta) {
    if (err) return callback(err);
    callback(null, new Host(hostId, meta));
  });
};

Host.prototype = {

  /**
   * Proxies a stop call to the main process.
   *
   * @param {Function} callback [Error err].
   */
  stop: function(callback) {
    Requests.emit('stopHost', this._id, callback);
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
   * @param {Function} callback [Error err].
   */
  restart: function(callback) {
    Requests.emit('restartHost', this._id, function(err, meta) {
      if (err) return callback(err);

      // update the values given by the main thread.
      this.updateMeta(meta);

      callback();
    }.bind(this));
  }
};

module.exports.Host = Host;
