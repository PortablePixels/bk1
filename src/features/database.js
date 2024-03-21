var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debug = require('debug')('botkit:db');

module.exports = function(botkit) {

  if (!process.env.MONGO_URI) {
    throw new Error('Please specify a valid MONGO_URI in this applications .env');
  }
  
  let connectionOptions = {
    tls: true,
    useUnifiedTopology: true,
    replicaSet: "replicaset"
  }

  // TODO: a password with an unescaped char causes an unhandled rejection somewhere in here!
  mongoose.connect(process.env.MONGO_URI, connectionOptions);

  mongoose.Promise = global.Promise;

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    // we're connected!
    debug('CONNECTED TO DB!');
    botkit.trigger('boot:database_connected',[]);
  });


  botkit.db = {
    mongoose: db,
    schema: Schema,
    addModel: function(model, name, key) {
        botkit.db[key] = mongoose.model(name, new Schema(model), key);
    }
  };

}
