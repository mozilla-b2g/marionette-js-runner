suite('runtime/filterdata', function() {
  var FilterData = require('../../lib/runtime/filterdata').FilterData;
  var filter, potential_metadata1, potential_metadata2, potential_metadata3,
    potential_metadata4, potential_metadata5, potential_metadata6;

  setup(function() {
    filter = {foo: 1, bar: "2", host: ["firefox", "b2g-desktop", "device"]};
    potential_metadata1 = {host: "firefox", foo: 1, bar: "2"};
    potential_metadata2 = {host: "firefox", foo: 1, bar: 2};
    potential_metadata3 = {host: 1, bar: "2", arr: ["firefox"]};
    potential_metadata4 = {host: "firefox", foo: "2", bar: "2"};
    potential_metadata5 = {host: "firefox", foo: 1, bar: "2", hello: {}};
    potential_metadata6 = {host: "firefox", foo: 1};
  });

  test('validate', function() {
    assert.equal(FilterData.validate(filter, filter), false);
    assert.equal(FilterData.arrayCheck(filter.host, filter.host), false);
    assert.equal(FilterData.validate(filter, potential_metadata1), true);
    assert.equal(FilterData.arrayCheck(filter.host, potential_metadata1.host), true);
    assert.equal(FilterData.any(filter.host, potential_metadata1.host), false);
    assert.equal(FilterData.validate(filter, potential_metadata2), false);
    assert.equal(FilterData.arrayCheck(filter.host, potential_metadata2.host), true);
    assert.equal(FilterData.any(filter.host, potential_metadata2.host), false);
    assert.equal(FilterData.validate(filter, potential_metadata3), false);
    assert.equal(FilterData.arrayCheck(filter.host, potential_metadata3.host), false);
    assert.equal(FilterData.validate(filter, potential_metadata4), false);
    assert.equal(FilterData.arrayCheck(filter.host, potential_metadata4.host), true);
    assert.equal(FilterData.any(filter.host, potential_metadata4.host), false);
    assert.equal(FilterData.validate(filter, potential_metadata5), true);
    assert.equal(FilterData.arrayCheck(filter.host, potential_metadata5.host), true);
    assert.equal(FilterData.any(filter.host, potential_metadata5.host), false);
    assert.equal(FilterData.validate(filter, potential_metadata6), false);
    assert.equal(FilterData.arrayCheck(filter.host, potential_metadata6.host), true);
    assert.equal(FilterData.any(filter.host, potential_metadata6.host), false);
  });
});
