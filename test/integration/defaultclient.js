suite('default client', function() {
  var google = 'http://www.google.com';

  test('going to url', function() {
    this.client.goUrl(google);
    var url = this.client.getUrl();

    assert.ok(url.indexOf(google) !== -1);
  });

});
