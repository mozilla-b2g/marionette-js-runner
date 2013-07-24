suite('Marionette', function() {
  var marionette = require('../lib/marionette').marionette;
  var name, filter, metadata1, metadata2;
  setup(function() {
  	name = 'marionetteTest';
  	filter = {foo: 1, bar: "2", host: ["firefox", "b2g-desktop", "device"]};
  	metadata1 = {host: "firefox", foo: 1, bar: "2"};
  	metadata2 = {host: "chrome", foo: 1, bar: "2"};
  });    
  test('Runs only when marionette is called', function(done) {
    marionette(name, filter, metadata1, done);
  });
  test('Metadata fails in marionette', function(done) {
    marionette(name, filter, metadata2, done);
    done();
  });
});