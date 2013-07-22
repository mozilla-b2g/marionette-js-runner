var Requests = require('./requests').Requests;

/**
 * Proxy implementation of the "host"
 */
function Host(hostId) {
  this._id = hostId;
}

/**
 * Request a new host from the parent process.
 *
 * @param {Function} callback [Error err, Host host].
 */
Host.create = function(callback) {
  Requests.emit('createHost', function(err, hostId) {
    if (err) return callback(err);

    callback(null, new Host(hostId));
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
