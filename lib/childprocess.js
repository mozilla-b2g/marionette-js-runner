var fs = require('fs');
var filepathname = process.env.METADATA_FILE;
var contents = fs.readFileSync(filepathname, 'utf8');
var data = JSON.parse(contents);

function compareObjects(obj1,obj2) {
	for (var prop in obj1) {
		if (prop in obj2) {
			if (obj1[prop] instanceof Array) {
				if (!(obj2[prop] instanceof Array))	{
					if (obj1[prop].indexOf(obj2[prop]) === -1) {
						return false;
					} 
				}
				else {
					return false;
				}
			} 
			else if (obj1[prop] != obj2[prop]) {
				return false;
			} 
		}
		else {
			return false;
		} 
	} 
	return true;
}

function marionette(name, filter, callback)	{
	if (compareObjects(filter,data))	{
		suite(name. callback);
	}
}