suite('default client', function() {
  var google = 'http://www.google.com',
      yahoo = 'http://www.yahoo.com';

  test('go to google', function() {
    this.client.goUrl(google);
    var url = this.client.getUrl();
    assert.ok(url.indexOf(google) !== -1);
  });

  test('go to yahoo', function() {
    this.client.goUrl(yahoo);
    var url = this.client.getUrl();
    assert.ok(url.indexOf(yahoo) !== -1);
  });
});
