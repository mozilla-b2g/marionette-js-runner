var fs = require('fs');

var filepathname = process.env.METADATA_FILE;

var contents = fs.readFileSync(filepathname).toString();

var data = JSON.parse(contents);

var host = data.host;

runTests(host); 


function runTests(host)	{
	if (host === 'firefox' || host === 'b2g-desktop')	{
		marionette('testOnFirefoxORB2G',
			{ host: ['firefox', 'b2g-desktop'] }, function() {});
		marionette('testOnHost', { host: host }, function() {
		});
	}
	else if (host !== 'everything') {
		marionette('testOnHost', { host: host }, function() {
		});
	}
	// runs always
	marionette('everything', function() {
	});
}