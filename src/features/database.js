var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debug = require('debug')('botkit:db');

module.exports = function(botkit) {

  if (!process.env.MONGO_URI) {
    throw new Error('Please specify a valid MONGO_URI in this applications .env');
  }

  var serverSelectionTimeoutMS = parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10);
  if (isNaN(serverSelectionTimeoutMS)) { serverSelectionTimeoutMS = 5000; }

  let connectionOptions = {
    tls: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    replicaSet: process.env.MONGO_REPLICA_SET || "replicaset",
    serverSelectionTimeoutMS: serverSelectionTimeoutMS
  }

  mongoose.Promise = global.Promise;

  var bufferTimeoutMS = parseInt(process.env.MONGO_BUFFER_TIMEOUT_MS, 10);
  if (!isNaN(bufferTimeoutMS)) {
    mongoose.set('bufferTimeoutMS', bufferTimeoutMS);
  }

  mongoose.connect(process.env.MONGO_URI, connectionOptions)
    .then(function() {
      debug('mongoose.connect() resolved (readyState=%d)', mongoose.connection.readyState);
    })
    .catch(function(err) {
      console.error('Mongoose initial connection failed:', err && err.message);
      process.exit(1);
    });

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
