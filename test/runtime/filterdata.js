suite('runtime/filterdata', function() {
  //var mock = mockProcessSend();
  var filterData = require('../../lib/runtime/filterdata').filterData;
  var obj1, obj2, obj3, obj4, obj5, obj6, obj7;

  setup(function() {
      obj1 = {foo: 1, bar: "2", arr: [75, 234, 98]};
      obj2 = {arr: 75, foo: 1, bar: "2"};
      obj3 = {arr: 75, foo: 1, bar: 2};
      obj4 = {foo: 1, bar: "2", arr: [75]};
      obj5 = {arr: 75, foo: "2", bar: "2"};
      obj6 = {arr: 75, foo: 1, bar: "2", hello: {}};
      obj7 = {arr: 75, foo: 1};
  });

  test('validate', function() {
    assert.ok(obj1);
    assert.ok(obj2);
    assert.ok(obj3);
    assert.ok(obj4);
    assert.ok(obj5);
    assert.ok(obj6);
    assert.ok(obj7);
    assert.ok(filterData);
    assert.equal(filterData.validate(obj1,obj1), false);
    assert.equal(filterData.validate(obj1,obj2), true);
    assert.equal(filterData.validate(obj1,obj3), false);
    assert.equal(filterData.validate(obj1,obj4), false);
    assert.equal(filterData.validate(obj1,obj5), false);
    assert.equal(filterData.validate(obj1,obj6), true);
    assert.equal(filterData.validate(obj1,obj7), false);
  });
});
