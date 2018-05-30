var debug = require('debug')('botkit:middleware');
var ware = require('ware');
var clone = require('clone');

module.exports = function(botkit) {

    // define some middleware points where custom functions
    // can plug into key points of botkits process
    botkit.middleware = {

        spawn: ware(),

        // pipeline
        ingest: ware(),
        understand: ware(),

        // outbound
        send: ware(),


        beforeScript: ware(),
        afterScript: ware(),
        beforeThread: ware(),
        onChange: ware(),
    };

    botkit.ingest = function(bot, payload, source) {
        return new Promise(function(resolve, reject) {
            var message = clone(payload);

            if (!message.type) {
              message.type = 'message';
            }

            botkit.middleware.ingest.run(bot, message, function(err, bot, message) {
                if (err) {
                  return reject(err);
                }
                resolve(message);
            });
      });
    }


    botkit.understand = function(bot, message) {
      var response = {};
      return new Promise(function(resolve, reject) {
          if (!botkit.shouldEvaluate(message.type)) {
            botkit.trigger(message.type, [bot, message]);
          } else {
            botkit.middleware.understand.run(bot, message, response, function(err, bot, message, response) {
                if (err) {
                  console.error('Rejecting after understand', err);
                  return reject(err);
                }
                botkit.trigger(message.type, [bot, message]);

                resolve(response);
            });
          }
        });
    }


    // choose randomly from message text variants
    botkit.middleware.send.use(function(bot, message, next) {
      if (Array.isArray(message.text)) {
        message.text = message.text[Math.floor(Math.random()*message.text.length)];
      }
      next();
    });


    // copy in custom fields
    botkit.middleware.send.use(function(bot, message, next) {
      if (message.meta && message.meta.length) {
        for (var m = 0; m < message.meta.length; m++) {
          message[message.meta[m].key] = message.meta[m].value;
        }
      }

      // remove unnecessary fields
      delete(message.meta);

      next();
    });


    // copy in platform specific fields
    botkit.middleware.send.use(function(bot, message, next) {
      if (message.platforms && message.platforms[bot.type]) {
        for (var key in message.platforms[bot.type]) {
          message[key] = message.platforms[bot.type][key];
        }
      }

      // remove unnecessary fields
      delete(message.platforms);
      next();
    });




    botkit.middleware.beforeScript.use(function(convo, next) {
      debug('BEFORE ', convo.script.command);
      next();
    });
    botkit.middleware.beforeThread.use(function(convo, new_thread, next) {
      debug('BEFORE THREAD ', convo.script.command, new_thread);
      next();
    });

    botkit.middleware.onChange.use(function(convo, key, val, next) {
      debug('CHANGED VALUE ', convo.script.command, key, val);
      next();
    });
    botkit.middleware.afterScript.use(function(convo, next) {
      debug('AFTER', convo.script.command);
      next();
    });
}
