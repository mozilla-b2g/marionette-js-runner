var Promise = require('promise');
var uuid = require('uuid');
var errorIPC = require('./error_ipc');
var assert = require('assert');
var util = require('util');
var debug = require('debug')('marionette-js-runner:rpc');

var EventEmitter = require('events').EventEmitter;

/**

var rpc = new RPC(process.send.bind(process));

@constructor
@param {Function} send method to use.
*/
function RPC(send) {
  this.id = uuid.v4();
  this.objects = {};

  // Internal event handler.
  this._events = new EventEmitter();
  this.send = send;
}

RPC.prototype = {

  register: function(name, object) {
    debug('register', name);
    assert(!this.objects[name], 'cannot re-register name: ' + name);
    assert(typeof object === 'object', 'invalid object is a: ' + typeof obj);
    this.objects[name] = object;
  },

  /**
  Generate the client side for the RPC call.

  ```js
  var objClient = rpc.client('obj', ['doStuff']);

  objClient.doStuff().then(...)
  ```

  @param {String} name of the remote object.
  @param {Array<String>} methods which remote can handle.
  */
  client: function(name, methods) {
    debug('create client', name, methods);
    return methods.reduce(function(result, method) {
      result[method] = function() {
        var args = Array.prototype.slice.call(arguments);
        return this.request(name, method, args);
      }.bind(this);
      return result;
    }.bind(this), {});
  },

  request: function(name, method, args) {
    var id = uuid.v4();
    debug('issue request', name, method, id);

    return new Promise(function(accept, reject) {
      this.send([
        'rpc',
        this.id,
        {
          type: 'request',
          name: name,
          method: method,
          id: id,
          arguments: args
        }
      ]);

      this._events.once('response ' + id, function(payload) {
        debug('handle request', method, id, payload);
        switch (payload.result) {
          case 'resolved':
            return accept(payload.value);
          case 'rejected':
            return reject(errorIPC.deserialize(payload.value));
          case 'rpc':
            return accept(this.client(
              payload.value.name, payload.value.spec.methods
            ));
          default:
            throw new Error('Unknown payload format: ' + payload);
        }
      }.bind(this));
    }.bind(this));
  },

  /**
  Used in conjunction with process.on('message') can handle RPC requests.

  RPC Payload format:

  Request:
  ```
  [
    '<uuid>',
    {
      type: 'request',
      name: '<rpc name>',
      method: '<method>',
      id: '<id>',
      arguments: []
    }
  ]

  ```
  Response:

  [
    '<uuid>',
    {
      type: 'response',
      id: '<id>',
      result: '(rejected | resolved)'
      value: <value>
    }
  ]
  */
  handle: function() {
    return function(msg) {
      if (Array.isArray(msg)) {
        if (msg[0] === 'rpc') {
          return this.handleRequest(msg[1], msg[2]);
        }

        if (msg[0] === this.id) {
          this.handleResponse(msg[0], msg[1]);
        }
      }
    }.bind(this);
  },

  handleResponse: function(id, payload) {
    debug('handle response', id, payload);
    this._events.emit('response ' + payload.id, payload);
  },

  handleRequest: function(id, payload) {
    debug('handle request', id, payload);
    // object check first...
    var object = this.objects[payload.name];
    if (!object) {
      return this.send([id, {
        type: 'response',
        id: payload.id,
        result: 'rejected',
        value: { message: 'Unknown object name: ' + payload.name },
      }]);
    }

    // Ensure method name is there...
    if (!object[payload.method]) {
      return this.send([id, {
        type: 'response',
        id: payload.id,
        result: 'rejected',
        value: {
          message: util.format(
            'Unknown method "%s" for object name: "%s"',
            payload.method,
            payload.name
          )
        },
      }]);
    }

    // Finally run the method!
    object[payload.method].apply(object, payload.arguments)
      .then(function(value) {
        // if this object is an rpc object we send an id to reference the
        // object.
        if (typeof value === 'object' && value.$rpc) {
          // XXX: Figure out GC!
          var objectId = 'rpc-obj-' + uuid.v4();
          this.register(objectId, value);
          this.send([id, {
            type: 'response',
            id: payload.id,
            result: 'rpc',
            value: { name: objectId, spec: value.$rpc }
          }]);
          return;
        }

        this.send([id, {
          type: 'response',
          id: payload.id,
          result: 'resolved',
          value: value || ''
        }]);
      }.bind(this))
      .catch(function(err) {
        return this.send([id, {
          type: 'response',
          id: payload.id,
          result: 'rejected',
          value: errorIPC.serialize(err)
        }])
      }.bind(this));
  },
};

module.exports = RPC;
