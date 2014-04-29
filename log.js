
var debug = false
;

Error.prototype.log = function() {
  var id = this.id;
  if (!id) id = 'unk';
  console.error(new Date, this);
  console.error(this.stack);
};


module.exports = {
  init: function(config) {
    debug = config.debug;
    console.error(new Date, 'Server Started');
  },

  makeError: function(id, message/*, more args, ...*/) {
    var e = new Error([].slice.call(arguments, 0).map(JSON.stringify).join(' '));
    e.id = id;
    return e;
  },

  info: function() {
    console.info.apply(console, [new Date].concat([].slice.call(arguments, 0)));
  },

  error: function() {
    console.error.apply(console, [new Date].concat([].slice.call(arguments, 0)));
  },

  trace: function() {
    if (debug) {
      console.log.apply(console, [new Date].concat([].slice.call(arguments, 0)));
    }
  },

  enable_debug: function(enable) {
    if (typeof enable === 'undefined') debug = true;
    else debug = enable;
  }
};

