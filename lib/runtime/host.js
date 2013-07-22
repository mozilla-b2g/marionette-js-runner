var Requests = require('./requests').Requests;

/**
 * Proxy implementation of the "host"
 */
function Host(hostId, port) {
  this._id = hostId;
  this.port = port;
}

/**
 * Request a new host from the parent process.
 *
 * @param {Function} callback [Error err, Host host].
 */
Host.create = function(callback) {
  Requests.emit('createHost', function(err, hostId, port) {
    if (err) return callback(err);

    callback(null, new Host(hostId, port));
  });
};

Host.prototype = {
  stop: function(callback) {
    Requests.emit('stopHost', this._id, callback);
  },

  restart: function(callback) {
    Requests.emit('restartHost', this._id, callback);
  }
};

module.exports.Host = Host;
