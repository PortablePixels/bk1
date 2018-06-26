/*

  Botkit Core 1.0

  A toolkit for building conversational software of all types.
  This library contains the core functionality for receiving messages,
  sending replies, matching triggers of different types, and handling
  multi-message sessions through a system we call Conversations.

*/


var debug = require('debug')('botkit:core');
var fs = require('fs');

module.exports = function(config) {

    var skills_to_load = [];

    var botkit = {
        config: config,
        LIB_PATH: __dirname,
        boot: function() {
            debug('Booting bot...');
            var that = this;
            var has_db = false;
            var has_ws = false;
            var plugins_loaded = false;

            that.on('boot:database_connected', function() {
              has_db = true;
              if (has_ws && plugins_loaded) {
                that.trigger('booted',[that]);
              }
            });
            that.on('boot:webserver_up', function() {
              has_ws = true;
              if (has_db && plugins_loaded) {
                that.trigger('booted',[that]);
              }
            });
            that.on('boot:plugins_loaded', function() {
              plugins_loaded = true;
              if (has_db && has_ws) {
                that.trigger('booted',[that]);
              }
            });

            that.on('booted',function(controller) {
              debug('Boot complete!');
            });
        },
        receive: function(bot, message) {
            debug('Received: ', message);
            botkit.ingest(bot, message).then(function(message) {
              botkit.understand(bot, message).then(function(response) {
                debug('Response: ', response);
                if (response.script && response.script) {
                  var convo = botkit.createConversation(message, bot, response.state, response.script);
                  convo.fulfill();
                }
              });
            });
        },
        loadSkill: function(path_to_skill) {
            try {
              require(path_to_skill)(botkit);
            } catch(err) {
              throw new Error(err);
            }
        },
        loadSkills: function(path) {
            var normalizedPath = require("path").join(path);
            fs.readdirSync(normalizedPath).forEach(function(file) {
              botkit.loadSkill(normalizedPath + "/" + file);
            });
        },
        spawn: function(type,options) {
          var bot = {
            config: options,
            type: type,
            say: function(message) {
              var that = this;
              return new Promise(function(resolve, reject) {
                botkit.middleware.format.run(that, message, function(err, bot, message) {
                  if (err) {
                    reject(err);
                  } else {
                    botkit.middleware.send.run(bot, message, function(err, bot, message) {
                      if (err) {
                        reject(err);
                      } else {
                        bot.send(message).then(resolve).catch(reject);
                      }
                    });
                  }
                });
              });
            },
          }
          return new Promise(function(resolve, reject) {
            botkit.middleware.spawn.run(bot, function(err, bot) {
              if (err) {
                reject(err);
              } else {
                resolve(bot);
              }
            });
          });
        }
    }

    // basic emitting and handling of events
    require(__dirname + '/features/events.js')(botkit);

    // Add pre-configured Express webserver
    require(__dirname + '/features/webserver.js')(botkit);

    // Add pre-configured Express webserver
    require(__dirname + '/features/plugin_loader.js')(botkit);

    // expose middleware endpoints and processes for processing messages
    require(__dirname + '/features/middleware.js')(botkit);

    if (config.studio_token) {

      // database models and access routines
      require(__dirname + '/features/database.js')(botkit);

      // set up the ability to walk through a semi-scripted conversation
      require(__dirname + '/features/conversation.js')(botkit);

      // API calls to botkit studio
      require(__dirname + '/features/API.js')(botkit);

      // methods for understanding the intent or purpose of the message
      // including connecting it to an already existing conversation
      require(__dirname + '/features/understand_sessions.js')(botkit);

      // add ability to "hear" simple triggers in message events
      require(__dirname + '/features/understand_hearing.js')(botkit);

      // add ability to take developer-defined actions
      require(__dirname + '/features/actions.js')(botkit);

      // add ability to "hear" simple triggers in message events
      // require(__dirname + '/features/understand_remote_triggers.js')(botkit);

      try {
          botkit.use(require(__dirname + '/plugins/plugin_manager/plugin.js'));
      } catch(err) {
          console.log('Caught error in plugin loader', err);
      }

      botkit.use(require(__dirname + '/plugins/index.js'));



    } else {

      botkit.use(require(__dirname + '/plugins/activate/plugin.js'));

    }


    return botkit;

}
