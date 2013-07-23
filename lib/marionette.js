var Filterdata = require('./runtime/filterdata').Filterdata;

/**
 * If filter matches criteria against metadata object, suite is executed
 * with parameters, name and callback, respectively.
 *
 * @param {String} name of suite to execute
 * @param {Object} filter Object to match against metadata
 * @param {Object} metadata Object to match against filter
 * @param {Function} Callback fired in suite
 */
function marionette(name, filter, metadata, callback)	{
	if (Filterdata.validate(filter, metadata))	{
		suite(name, callback);
	}
}

module.exports.Marionette = marionette;