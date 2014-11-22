'use strict';

var assert = require('assert');
var assign = require('object-assign');
var fsPath = require('path');

var Promise = require('promise');

var detectBinary =
  Promise.denodeify(require('mozilla-runner/lib/detectbinary').detectBinary);

var DEFAULT_LOCATION = fsPath.join(process.cwd(), 'b2g');

/**
Figure out where the b2g-bin lives based on options.

@param {Object} options (as described by .help).
@return {Promise<Null|String>} null if none is needed or a path.
*/
function resolveBinary(options) {
  return Promise.resolve().then(function() {
    if (options.buildapp !== 'desktop') return;
    if (options.runtime) return options.runtime;

    return detectBinary(options.target || DEFAULT_LOCATION, { product: 'b2g' });
  });
}

function Session(host, id, options) {
  this.host = host;
  this.id = id;
  this.options = options;
}

Session.prototype = {
  destroy: function() {
    var payload = { id: this.id };
    return this.host.request('/stop_runner', payload).then(function() {
      this.id = null;
    }.bind(this));
  }
};


Session.create = function(host, profile, options) {
  return Promise.resolve().then(function() {
    // shallow clone options...
    options = assign(
      // default options...
      {
        profile: profile,
        buildapp: 'desktop'
      },
      options
    );

    // Handle mutually exclusive options...
    assert(
      !(options.b2g_home && options.buildapp === 'desktop'),
      'Can only specify --b2gpath with a device or emulator buildapp.'
    );
    assert(
      !(!options.b2g_home && options.buildapp === 'emulator'),
      'Can only specify --b2gpath with a device or emulator buildapp.'
    );

    return resolveBinary(options).then(function(binary) {
      return host.request('/start_runner', {
        binary: binary,
        options: options
      });
    }).then(function(result) {
      return new Session(host, result.id, options);
    });
  });
};

module.exports = Session;
