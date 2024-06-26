var debug = require('debug')('botkit:sessions');
var events_to_evaluate = [];
var clone = require('clone');

var session_schema ={
  user: {
    type: String,
    index: true,
  },
  channel: {
    type: String,
    index: true,
  },
  state: {
    type: 'Object',
  },
  script: {
    type: 'Object',
  },
  lastActive: {
    type: Date,
    default: Date.now,
  }
}


module.exports = function(botkit) {

    botkit.db.addModel(session_schema,'session','sessions');

    botkit.listenToEvent = function(event_name) {
      if (events_to_evaluate.indexOf(event_name) < 0) {
        events_to_evaluate.push(event_name);
      }
    }

    botkit.shouldEvaluate = function(event_name) {
      return (events_to_evaluate.indexOf(event_name) >= 0)
    }

    botkit.listenToEvent('message');

    botkit.endSession = function(convo) {
      return new Promise(function(resolve, reject) {
        botkit.db.sessions.deleteOne({
            user: convo.context.user,
            channel: convo.context.channel
        }, function(err, res) {

            if (err) {
                console.error('Could not remove session', err);
                reject(err);
            }  else {
              resolve();
            }
        });
      });
    }

    botkit.removeTempFields = function(script) {

      var clean = clone(script);
      // generate message ids for every message
      clean.script.map(function(thread) {
        for (var m = 0; m < thread.script.length; m++) {
          for (var key in thread.script[m]) {
            if (key.match(/^\$/)) {
              delete(thread.script[m][key]);
            }
          }
        }
      })

      return clean;
    }

    botkit.storeConversationState = function(convo) {
        return new Promise(function(resolve, reject) {
            botkit.db.sessions.findOneAndUpdate({
                user: convo.context.user,
                channel: convo.context.channel,
            }, {
                user: convo.context.user,
                channel: convo.context.channel,
                state: convo.state,
                script: botkit.removeTempFields(convo.script),
                lastActive: new Date(),
            }, {upsert: true}, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    botkit.findSession = function(user, channel) {
      return new Promise(function(resolve, reject) {
        botkit.db.sessions.find({
          user: user,
          channel: channel,
        }, function(err, sessions) {
          if (err) {
            return reject(err);
          }
          if (sessions.length) {
            debug('Got a session', sessions);
            resolve(sessions[0]);
          } else {
            resolve();
          }
        });
      });
    }


    botkit.middleware.understand.use(function(bot, message, response, next) {
      // look for an existing conversation state object in the database.
      // if one exists, restore it.
      debug('EVALUATE', message);
      botkit.findSession(message.user, message.channel).then(function(session) {
        if (session) {
          response.state = session.state;
          response.script = session.script;
        }
        next();

      }).catch(next);

    });


}
