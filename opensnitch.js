
var os = require('os')
  , redis = require('redis')
  , redisClient = redis.createClient()
  , log = require('./log')
  , web = require('./webapp')
  , monitor = require('./monitor')
  , model = require('./model')
  , config = require('./config')
  , app
  , server
;

config.http = config.http || {};
config.email = config.email || {};
config.email.server = config.email.server || {host: 'localhost'};
config.email.from = config.email.from || 'opensnitch@' + os.hostname();

redisClient.on('error', function (err) {
  log.error('Redis Error ' + err);
});

model = model.configure(config);

app = web.app(config, model, redisClient);

server = app.listen(config.http.port || 3000, function() {
  log.info('Listening on port ' + server.address().port);
});

monitor.start(config, model, redisClient);

