/**
 * Custom marionette-runner interface for mocha.
 */

var HostManager = require('./runtime/hostmanager').HostManager;
var Mocha = module.parent.require('mocha');
var RetryTest = require('mocha-retry/retryTest');
var Suite = Mocha.Suite;
var Test = require('mocha/lib/test');
var escapeRe = require('escape-string-regexp');
var filter = require('./runtime/filter');
var retrySuite = require('mocha-retry/retrySuite');

retrySuite(Mocha);

module.exports = function(suite) {
  var manager = new HostManager();
  var suites = [suite];

  suite.on('pre-require', function(context, file, mocha) {
    context.setup = function(name, fn) {
      suites[0].beforeEachWithRetry(2, name, fn);
    };

    context.teardown = function(name, fn) {
      suites[0].afterEachWithRetry(2, name, fn);
    };

    context.suiteSetup = function(name, fn) {
      suites[0].beforeAllWithRetry(2, name, fn);
    };

    context.suiteTeardown = function(name, fn) {
      suites[0].afterAllWithRetry(2, name, fn);
    };

    /**
     * If filter matches criteria against metadata object, suite is executed
     * with parameters, name and callback, respectively.
     *
     * @param {String} name of suite to execute.
     * @param {Object} filter Object to match against metadata.
     * @param {Function} callback fired in suite.
     */
    context.marionette = function(name, suiteFilter, fn) {
      // argument folding
      if (typeof suiteFilter === 'function') {
        fn = suiteFilter;
        suiteFilter = {};
      }

      if (filter.validate(suiteFilter, context.marionette.metadata)) {
        context.suite(name, fn);
      }
    };

    /**
     * global state modifies for marionette
     *
     * @type {Object}
     */
    context.marionette.metadata = findMetadata();

    // Setup global state manager for the marionette runtime.
    context.marionette._manager = manager;
    context.marionette.client = manager.createHost.bind(manager);
    context.marionette.plugin = manager.addPlugin.bind(manager);

    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */
    context.suite = function(title, fn) {
      var suite = Suite.create(suites[0], title);
      suite.file = file;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
      return suite;
    };

    /**
     * Pending suite.
     */
    context.suite.skip = function(title, fn) {
      var suite = Suite.create(suites[0], title);
      suite.pending = true;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
    };

    /**
     * Exclusive test-case.
     */
    context.suite.only = function(title, fn) {
      var suite = context.suite(title, fn);
      mocha.grep(suite.fullTitle());
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    context.test = function(title, fn) {
      var suite = suites[0];
      if (suite.pending) var fn = null;
      var test = new RetryTest(2, title, fn);
      test.file = file;
      suite.addTest(test);
      return test;
    };

    /**
     * Exclusive test-case.
     */
    context.test.only = function(title, fn) {
      var test = context.test(title, fn);
      var reString = '^' + escapeRe(test.fullTitle()) + '$';
      mocha.grep(new RegExp(reString));
    };

    /**
     * Pending test case.
     */
    context.test.skip = function(title) {
      context.test(title);
    };
  });
};

/**
 * Internal method designed to attempt to find the metadata for this child
 * process based on the environment variable CHILD_METADATA.
 *
 * The environment variable is expected to be a base64 encoded string which can
 * be parsed as JSON.
 *
 *
 * @private
 * @return {Object}
 */
function findMetadata() {
  if (!process.env.CHILD_METADATA)
    return {};

  try {
    return JSON.parse(
      new Buffer(process.env.CHILD_METADATA, 'base64').toString()
    );
  } catch (e) {
    console.error('could not parse CHILD_METADATA');
    return {};
  }

  return result;
}
