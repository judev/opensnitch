
var Q = require('q')
  , shortId = require('shortid')
  , log = require('./log')
;

function intval(s) {
  var v = parseInt(s, 10);
  if (isNaN(v)) return 0;
  return v;
}

function key(name) {
  return 'regulard:' + name;
}

var Item = function(redis, info) {
  this.redis = redis;
  this.info = info;
  this.info.ts = intval(this.info.ts);
  this.info.alert_ts = intval(this.info.alert_ts);
};

Item.prototype.id = function() {
  return this.info.id;
};

Item.prototype.title = function() {
  return this.info.title;
};

Item.prototype.lastUpdateDate = function() {
  return new Date(this.info.ts);
};

Item.prototype.overdue = function() {
  return Date.now() > intval(this.info.ts) + (this.info.freq * 1000)
};

Item.prototype.shouldAlert = function() {
  if (this.info.ts > 0 && Date.now() > intval(this.info.ts) + (this.info.freq * 1000 * 1.25)) {
    if (intval(this.info.alert_ts) === 0 || Date.now() > this.info.alert_ts + (Item.alert_repeat_frequency * 1000)) {
      return true;
    }
  }
  return false;
};

Item.prototype.alerted = function() {
  this.info.alert_ts = Date.now();
};

Item.prototype.getTrackingUrl = function() {
  return "/t/" + this.info.id;
};

Item.prototype.track = function() {
  var ts = Date.now();
  this.info.ts = ts;
  this.info.alert_ts = 0;
  return Q.all([
    Q.ninvoke(this.redis, 'zadd', key('times'), ts, this.info.id),
    Q.ninvoke(this.redis, 'hset', key('idents:' + this.info.id), 'ts', ts),
    Q.ninvoke(this.redis, 'hset', key('idents:' + this.info.id), 'alert_ts', 0)
  ]);
};

Item.prototype.save = function() {
  var ts = Date.now()
    , self = this
  ;
  if (typeof this.info.ts === 'undefined') {
    this.info.ts = ts;
    this.info.alert_ts = 0;
  }
  return Q.all([
    Q.ninvoke(this.redis, 'zadd', key('times'), ts, this.info.id),
    Q.ninvoke(this.redis, 'hmset', key('idents:' + this.info.id), this.info)
  ]).then(function() {
    return self;
  })
  ;
};

Item.prototype.forget = function() {
  return Q.all([
    Q.ninvoke(this.redis, 'zrem', key('times'), this.info.id),
    Q.ninvoke(this.redis, 'del', key('idents:' + this.info.id))
  ]);
};

Item.prototype.frequency = function() {
  for (var label in Item.frequencies) {
    if (Item.frequencies[label] == this.info.freq) {
      return label;
    }
  }
  return '';
};

Item.load = function(redis, id) {
  return Q.ninvoke(redis, 'hgetall', key('idents:' + id))
    .then(function(info) {
      if (info) {
        return new Item(redis, info);
      }
      throw new Error('Unknown ID: ' + id);
    });
};

Item.create = function(redis, frequency, info) {
  info.id = shortId.generate();
  info.freq = frequency;
  var item = new Item(redis, info);
  return item.save();
};

Item.findOutstanding = function(redis) {
  var ts = Date.now();
  return Q.ninvoke(redis, 'zrangebyscore', key('times'), 0, ts)
    .then(function(items) {
      var promises = [];
      items.forEach(function(id) {
        var promise = Item.load(redis, id)
        .then(function(item) {
          if (item.overdue()) {
            return item;
          }
        })
        .fail(function(){})
        ;
        promises.push(promise);
      });
      return Q.all(promises).then(function(items) {
        return items.filter(function(item) {return item});
      });
    })
  ;
};

Item.find = function(redis) {
  var ts = Date.now();
  return Q.ninvoke(redis, 'zrevrange', key('times'), 0, -1)
    .then(function(items) {
      var promises = [];
      items.forEach(function(id) {
        var promise = Item.load(redis, id)
        .fail(function(){})
        ;
        promises.push(promise);
      });
      return Q.all(promises).then(function(items) {
        return items.filter(function(item) {return item});
      });
    })
  ;
};

Item.frequencies = {
  "5 minutes": 5 * 60,
  "10 minutes": 10 * 60,
  "15 minutes": 15 * 60,
  "20 minutes": 20 * 60,
  "30 minutes": 30 * 60,
  "1 hour": 60 * 60,
  "6 hours": 6 * 60 * 60,
  "24 hours": 24 * 60 * 60,
  "48 hours": 2 * 24 * 60 * 60,
  "1 week": 7 * 24 * 60 * 60,
  "2 weeks": 2 * 7 * 24 * 60 * 60,
  "3 weeks": 3 * 7 * 24 * 60 * 60,
  "4 weeks": 4 * 7 * 24 * 60 * 60,
};

Item.alert_repeat_frequency = 24 * 60 * 60;

module.exports = {
  Item: Item,
  configure: function(config) {
    if (config.alert_repeat_frequency) {
      Item.alert_repeat_frequency = config.alert_repeat_frequency;
    }
    return module.exports;
  },
};


