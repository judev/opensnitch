
var test = require("tape").test
  , model = require("../model")
;

test("alert_repeat_frequency is configurable", function(t) {
  var original = model.Item.alert_repeat_frequency
    , modified = original + 3600
  ;
  model.configure({
    alert_repeat_frequency: modified
  });
  t.equal(model.Item.alert_repeat_frequency, modified, "alert_repeat_frequency should equal " + modified);
  t.end();
});

test("frequency controls whether overdue", function(t) {
  var redis = {}
    , freq = 100
    , info = {
      freq: freq,
      ts: Date.now() - ((freq + 10) * 1000)
    }
    , item = new model.Item(redis, info)
  ;

  t.ok(item.overdue(), "overdue after frequency seconds have passed since last update");

  info = {
    freq: freq,
    ts: Date.now() - ((freq - 1) * 1000)
  };
  item = new model.Item(redis, info);

  t.notOk(item.overdue(), "not overdue before frequency seconds have passed since last update");

  t.end();
});

test("alert time is adjusted by 1.25 times frequency to allow for slop", function(t) {
  var redis = {}
    , freq = 100
    , info = {
      freq: freq,
      ts: Date.now() - ((freq + 26) * 1000)
    }
    , item = new model.Item(redis, info)
  ;

  t.ok(item.shouldAlert(), "should alert when overdue by 1.25 times frequency and has not alerted before");

  info = {
    freq: freq,
    ts: Date.now() - ((freq + 10) * 1000)
  };
  item = new model.Item(redis, info);

  t.notOk(item.shouldAlert(), "should not alert when overdue by less than 1.25 times frequency and has not alerted before");

  t.end();
});

test("should only alert if not already alerted within alert_repeat_frequency", function(t) {
  var redis = {}
    , freq = 100
    , info = {
      freq: freq,
      ts: Date.now() - ((freq + 25) * 1000),
      alert_ts: Date.now() - ((model.Item.alert_repeat_frequency / 2) * 1000),
    }
    , item = new model.Item(redis, info)
  ;

  t.notOk(item.shouldAlert(), "should not alert when overdue by 1.25 times frequency but has alerted recently");

  info = {
    freq: freq,
    ts: Date.now() - ((freq + 26) * 1000),
    alert_ts: Date.now() - ((model.Item.alert_repeat_frequency + 1) * 1000),
  };
  item = new model.Item(redis, info);

  t.ok(item.shouldAlert(), "should alert when overdue by 1.25 times frequency and has alerted but not recently");

  t.end();
});

test("still works when input data contains numbers as strings", function(t) {
  var redis = {}
    , freq = 100
    , info = {
      freq: '' + (freq),
      ts: '' + (Date.now() - ((freq + 26) * 1000)),
      alert_ts: '' + (Date.now() - ((model.Item.alert_repeat_frequency + 1) * 1000)),
    }
    , item = new model.Item(redis, info)
  ;

  t.ok(item.shouldAlert());
  t.end();
});

