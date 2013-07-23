var Filterdata = {
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
	 * Checks if value is an array and if not whether value is
	 * and element in array
	 *
	 * @param {Array} array which may or may not
	 * contain an element equal to value
	 *
	 * @param {Object} value which may or may not be an element in array
	 *
	 */
	arrayCheck: function(array, value)	{
		if (value instanceof Array) {
			return false;
		} else {
			return !(this.any(array, value));
		}
	},

	/**
     * Checks the equality of two objects, with a special case for object
     * properties that are arrays. 
     *
     * @param {Object} filter Object to be compared for equality ot metadata.
     *
     * @param {Object} metadata Object in which all property key value pairs,
     * other than arrays musy match those of filter. In case of an array
     * property in filter, metadata must have an equivalent key whose value is
     * present in the array.
     */
	validate: function(filter, metadata) {
		for (var prop in filter) {
			if (!(prop in metadata))	{
				return false;
			} else if (prop in metadata) {
				if (filter[prop] instanceof Array) {
					if (!(this.arrayCheck(filter[prop], metadata[prop])))	{
						return false;
					}
				} else if (filter[prop] !== metadata[prop]) {
					return false;
				} 
			}
		} 
		return true;
	}
};

module.exports.Filterdata = Filterdata;
