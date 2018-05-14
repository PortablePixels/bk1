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
                  return reject(err);
                }

                botkit.trigger(message.type, [bot, message]);
                resolve(response);
            });
          }
        });
    }

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
