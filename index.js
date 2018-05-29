var env = require('node-env-file');
env(__dirname + '/.env');

var config = {
  // studio_token: 'VSZ3RwPWqaTyLGN79lMM99dOzJogvNQeLFVQI7sdw9ZmnV5D5mKhiLfFsNBDDOyI',
  studio_token: process.env.studio_token,
  slack: {
    clientId: process.env.SLACK_CLIENTID,
    clientSecret: process.env.SLACK_CLIENTSECRET,
    scopes: ['bot','commands']
  }
}

var botkit = require(__dirname + '/src/Core.js')(config)

botkit.loadSkills(__dirname + '/skills');

botkit.boot();

botkit.on('booted', function() {
  var bot = botkit.spawn('console');
});
