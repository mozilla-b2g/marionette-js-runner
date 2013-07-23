suite('Marionette', function() {
  var marionette = require('../lib/marionette').Marionette;
  var name, filter, metadata, callback;
  var result;
  setup(function() {
  	result = 0;
  	name = 'marionetteTest';
  	filter = {foo: 1, bar: "2", arr: [75, 234, 98]};
  	metadata = {arr: 75, foo: 1, bar: "2"};
  	callback = function()	{
  		result++;
  	}	
  });    
  test('Comparison', function() {
    assert.ok(marionette);
    assert.equal(result, 0);
    marionette(name, filter, metadata, callback);
    assert.equal(result, 1);
  });
});