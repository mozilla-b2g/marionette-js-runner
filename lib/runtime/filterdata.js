var fs = require('fs');
var filepathname = process.env.METADATA_FILE;
var contents = fs.readFileSync(filepathname, 'utf8');
var data = JSON.parse(contents);


var Filter = {
	any: function(haystack, needle) {
		return haystack.indexOf(needle) === -1;
	},

	arrayCheck: function(array, value)	{
		if (value instanceof Array) return false;
		else {
			return !(this.any(array, value));
		}
	},

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

function marionette(name, filter, callback)	{
	if (Filter.validate(filter, data))	{
		suite(name. callback);
	}
}

global.marionette = marionette;