var debug = require('debug')('botkit:remote_triggers');

module.exports = function(botkit) {


    // pass it through the ol' Botkit Studio trigger API
    botkit.middleware.understand.use(function(bot, message, response, next) {

      debug('EVALUATE', message);
      // already handled
      if (response.script) {
        debug('skipping api call');
        return next();
      }

      botkit.api.evaluateTrigger(message.text, message.user).then(function(script) {
        response.state = {
          thread: 'default',
          turn: 0,
          cursor: 0,
          vars: {
            user: {},
          },
        };
        response.script = script;

        var session = new botkit.db.sessions(
          {
            user: message.user,
            channel: message.channel,
            state: response.state,
            script: response.script,
          }
        );
        session.save(function(err) {
          if (err) {
            next(err);
          } else {
            next();
          }
        })
      }).catch(next);

    });


    // set up handlers for legacy botkit.studio.* hooks

    var handlers = {}


    botkit.studio = {
      before: function(script_name, handler) {
        botkit.middleware.beforeScript.use(function(convo, next) {
          if (convo.script.command == script_name) {
            handler(convo, function() {
              next();
            });
          } else {
            next();
          }
        });
      },
      after: function(script_name, handler) {
        botkit.middleware.afterScript.use(function(convo, next) {
          if (convo.script.command == script_name) {
            handler(convo, function() {
              next();
            });
          } else {
            next();
          }
        });
      },
      validate: function(script_name, var_name, handler) {
        botkit.middleware.onChange.use(function(convo, key, val, next) {
          if (convo.script.command == script_name && key == var_name) {
            handler(convo, function() {
              next();
            });
          } else {
            next();
          }
        });
      },
      beforeThread: function(script_name, thread_name, handler) {
        botkit.middleware.beforeThread.use(function(convo, new_thread, next) {
          if (convo.script.command == script_name && thread_name == new_thread) {
            handler(convo, function() {
              next();
            });
          } else {
            next();
          }
        });
      }
    }



}
