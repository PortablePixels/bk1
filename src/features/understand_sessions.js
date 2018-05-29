var debug = require('debug')('botkit:sessions');
var events_to_evaluate = [];

module.exports = function(botkit) {

    botkit.listenToEvent = function(event_name) {
      if (events_to_evaluate.indexOf(event_name) < 0) {
        events_to_evaluate.push(event_name);
      }
    }

    botkit.shouldEvaluate = function(event_name) {
      return (events_to_evaluate.indexOf(event_name) >= 0)
    }

    botkit.listenToEvent('message');

    botkit.middleware.understand.use(function(bot, message, response, next) {
      // look for an existing conversation state object in the database.
      // if one exists, restore it.
      debug('EVALUATE', message);

      botkit.db.sessions.find({
        user: message.user,
        channel: message.channel,
      }, function(err, sessions) {
        if (err) {
          return next(err);
        }
        if (sessions.length) {
          debug('Got a session', sessions);
          response.state = sessions[0].state;
          response.script = sessions[0].script;
          next();
        } else {
          next();
        }
      });
    });


}
