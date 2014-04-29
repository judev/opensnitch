
var email = require('emailjs')
  , Q = require('q')
  , log = require('./log')
;

module.exports = {

  start: function(config, model, redisClient) {

    setInterval(timedCheck, config.frequency ? config.frequency * 1000 : 60000);
    timedCheck();

    function timedCheck() {
      model.Item.findOutstanding(redisClient).then(function(items) {
        var promises = [];
        items.forEach(function(item) {
          if (item.shouldAlert()) {
            var contact = item.contact || config.default_contact;
            var subject = 'Missed job: ' + item.title();
            var server  = email.server.connect(config.email.server);
            promises.push(Q.ninvoke(server, 'send', {
              "text": item.title() + " last updated " + item.lastUpdateDate() + "\n\nNow: " + (new Date),
              "subject": subject,
              "from": config.email.from || ("regulard@" + os.hostname()),
              "to": contact
            }));
            log.info(subject + ' => ' + contact);
            item.alerted();
            promises.push(item.save());
          }
        })
        ;
        return Q.all(promises);
      })
      .fail(function(err) {
        err.log();
      })
      ;
    }

  },

};

