var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;
var debug = require('debug')('botkit:db');

module.exports = function(botkit) {

  mongoose.connect(process.env.MONGO_URI, {
  });

  mongoose.Promise = global.Promise;

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    // we're connected!
    debug('CONNECTED TO DB!');
    botkit.trigger('boot:database_connected',[]);
  });

  var session = new Schema({
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
    }
  });

  botkit.db = {
    mongoose: db,
    addModel: function(model, name, key) {
        botkit.db[key] = mongoose.model(name, new Schema(model), key);
    },
    sessions: mongoose.model('session', session),
  };

}
