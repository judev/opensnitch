
var express = require('express')
  , log = require('./log')
;

module.exports = {

  app: function(config, model, redisClient) {

    var app = express();

    app.use(express.bodyParser());

    app.set('view engine', 'jade');


    var auth = [];
    if (config.auth && config.auth.user && config.auth.pass) {
      auth = express.basicAuth(function(user, pass, callback) {
        callback(null, user === config.auth.user && pass === config.auth.pass);
      });
    }

    app.get('/favicon.ico', function(req, res) {
      res.send('Not found', 404);
    });

    app.get('/t/:id', function(req, res) {
      model.Item.load(redisClient, req.params.id)
      .then(function(item) {
        log.trace("Tracked: " + item.title());
        return item.track();
      })
      .then(function() {
        res.set({
          'content-type': 'text/plain'
        });
        res.send('');
      })
      .fail(function(err) {
        err.log();
        res.send(err.toString(), 500);
      });
    });

    app.get('/check', auth, function(req, res) {
      model.Item.findOutstanding(redisClient)
      .then(function(items) {
        var s = '';
        items.forEach(function(item) {
          s += item.id() + "\n";
        });
        res.send(s);
      })
      .fail(function(err) {
        err.log();
        res.send(err.toString(), 500);
      });
      ;
    });

    app.get('/', auth, function(req, res) {
      res.redirect("/i");
    });

    app.get('/i', auth, function(req, res) {
      model.Item.find(redisClient)
      .then(function(items) {
        res.render('list', {
          title: 'All items',
          items: items,
          urlPrefix: req.protocol + '://' + req.host
        });
      })
      .fail(function(err) {
        err.log();
        res.send(err.toString(), 500);
      });
      ;
    });

    app.get('/i/add', auth, function(req, res) {
      res.render('edit', {
        default_contact: config.default_contact,
        title: 'Add a check',
        url: req.path,
        item: {
          title:''
        },
        frequencies: model.Item.frequencies
      });
    });

    app.post('/i/add', auth, function(req, res) {
      var info = {
        title: req.body.title,
        freq: req.body.freq,
        contact: req.body.contact
      };
      model.Item.create(redisClient, req.body.freq, info)
      .then(function(item) {
        res.redirect("/i");
      })
      .fail(function(err) {
        err.log();
        res.send(err.toString(), 500);
      });
      ;
    });

    app.get('/i/:id', auth, function(req, res) {
      model.Item.load(redisClient, req.params.id).then(function(item) {
        res.render('show', {
          title: item.title(),
          item: item,
          urlPrefix: req.protocol + '://' + req.host
        });
      })
      .fail(function(err) {
        err.log();
        res.send(err.toString(), 500);
      });
      ;
    });

    app.get('/i/:id/edit', auth, function(req, res) {
      model.Item.load(redisClient, req.params.id).then(function(item) {
        res.render('edit', {
          default_contact: config.default_contact,
          title: 'Edit check',
          url: req.path,
          item: item.info,
          frequencies: model.Item.frequencies
        });
      });
    });

    app.post('/i/:id/edit', auth, function(req, res) {
      model.Item.load(redisClient, req.params.id).then(function(item) {
        var promise;
        if (req.body.deletebutton === '1') {
          promise = item.forget();
        }
        else {
          item.info.title = req.body.title;
          item.info.freq = req.body.freq;
          item.info.contact = req.body.contact;
          promise = item.save();
        }
        return promise.then(function() {
          res.redirect("/i");
        });
      })
      .fail(function(err) {
        err.log();
        res.send(err.toString(), 500);
      });
      ;
    });

    return app;
  },

};

