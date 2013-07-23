var Host = require('./runtime/host').Host;

suiteSetup(function(done) {
  // create default host
  Host.create(function(err, host) {
    if (err) return done(err);

    this.defaultHost = host;
    done();
  }.bind(this));
});

teardown(function(done) {
  this.defaultHost.restart(done);
});

suiteTeardown(function(done) {
  this.defaultHost.stop(done);
});


var Filterdata = require('./runtime/filterdata').Filterdata;

/**
 * If filter matches criteria against metadata object, suite is executed
 * with parameters, name and callback, respectively.
 *
 * @param {String} name of suite to execute
 * @param {Object} filter Object to match against metadata
 * @param {Function} Callback fired in suite
 */
function marionette(name, filter, callback)	{
	if (Filterdata.validate(filter, data))	{
		suite(name. callback);
	}
}

global.marionette = marionette;