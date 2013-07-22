var fs = require('fs');
var filepathname = process.env.METADATA_FILE;
var contents = fs.readFileSync(filepathname, 'utf8');
var data = JSON.parse(contents);


var Filter = {
	/**
	* Checks if needle is in haystack
	*
	* @param {Array} haystack array which may or may no contain needle
	* @param {Object} needle Object which may or may not be in haystack
	*/
	any: function(haystack, needle) {
		return haystack.indexOf(needle) === -1;
	},

	/**
	* Checks if value is an array and if not whether
	* value is and element in array
	*
	* @parm {Array} array which may or may not
	* contain an element equal to value
	*
	* @param {Object} value which may or may not be an element in array
	*
	*/
	arrayCheck: function(array, value)	{
		if (value instanceof Array) return false;
		else {
			return !(this.any(array, value));
		}
	},

	/**
     * Checks the equality of two objects, with a special case for object
     * properties that are arrays. 
     *
     * @param {Object} filter Object to be compared for equality ot metadata.
     * @param {Object} metadata Object in which all property key value pairs,
     * other than arrays musy match those of filter. In case of an array
     * property in filter, metadat must have an equivalent key whose value is
     * present in the array.
     */
	validate: function(filter, metadata) {
		for (var prop in filter) {
			if (prop in metadata) {
				if (filter[prop] instanceof Array) {
					if (!(this.arrayCheck(filter[prop], metadata[prop])))	{
						return false;
					}
				} 
				else if (filter[prop] != metadata[prop]) {
					return false;
				} 
			}
			else {
				return false;
			} 
		} 
		return true;
	}
};


/**
* If filter matches criteria against metadata object, suite is executed
* with parameters, name and callback, respectively.
*
* @param {String} name of suite to execute
* @param {Object} filter Object to match against meatdata
* @param {Function} Callback fired in suite
*/
function marionette(name, filter, callback)	{
	if (Filter.validate(filter, data))	{
		suite(name. callback);
	}
}

global.marionette = marionette;