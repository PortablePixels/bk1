var config = {
  studio_token: 'VSZ3RwPWqaTyLGN79lMM99dOzJogvNQeLFVQI7sdw9ZmnV5D5mKhiLfFsNBDDOyI',
}

var botkit = require(__dirname + '/src/Core.js')(config)

botkit.loadSkills(__dirname + '/skills');

botkit.use(require(__dirname + '/plugins/console.js'));
botkit.use(require(__dirname + '/plugins/index.js'));
botkit.use(require(__dirname + '/plugins/botkit-adapter-web/plugin.js'));


botkit.boot();

botkit.on('booted', function() {
  var bot = botkit.spawn('console');
});
