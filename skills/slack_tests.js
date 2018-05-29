module.exports = function(botkit) {

  botkit.on('channel_join', function(bot, message) {
    console.log('someone joined a channel!');
    bot.reply(message,'Oh hai, <@' + message.user + '>');
  });

  botkit.on('bot_channel_join', function(bot, message) {
    console.log('i joined a channel!');
    bot.reply(message,'I joined this channel. Definitely me.');
  });


  botkit.on('reaction_added', function(bot, message) {
    console.log('reaction added event!');
    bot.reply(message,'OMG I LOVE EMOJI RESPONSES TOO!');
  });

}
