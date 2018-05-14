var debug = require('debug')('botkit:hearing');

module.exports = function(botkit) {


  botkit.triggers = {};

  botkit.hears = function(patterns, events, handler) {
    debug('Listening for ', patterns);
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }
    if (!Array.isArray(events)) {
      events = [events];
    }

    for (var p = 0; p < patterns.length; p++) {
      for (var e = 0; e < events.length; e++) {
        var event = events[e];
        var pattern = patterns[p];

        if (!botkit.triggers[event]) {
          botkit.triggers[event] = [];
        }

        botkit.triggers[event].push({
          pattern: pattern,
          handler: handler,
        });

      }
    }
  }

  botkit.middleware.understand.use(function(bot, message, response,next) {
    debug('EVALUATE', message);

    if (response.script) {
      debug('Already got a scripted response');
      return next();
    }

    if (botkit.triggers[message.type]) {
      var triggers = botkit.triggers[message.type];
      for (var t = 0; t < triggers.length; t++) {
        var trigger = triggers[t];
        if (message && message.text.match(trigger.pattern)) {
          debug('PATTERN MATCH!', trigger.pattern, message.text);
          trigger.handler(bot, message);

          // do not call next, thus stopping the middleware from continuing
          return;
        }
      }
      next();
    } else {
      next();
    }

  });


}
