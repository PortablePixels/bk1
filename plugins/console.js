const readline = require('readline');

module.exports = function(botkit) {
        return {
            name: 'Console Bot Adapter',
            init: function() {
                var bot = botkit.spawn('console',{});
            },
            middleware: {
                spawn: [
                    function(bot, next) {
                        if (bot.type == 'console') {

                            bot.rl = readline.createInterface({
                                input: process.stdin,
                                output: process.stdout,
                                prompt: '> ',
                            });

                            bot.rl.prompt();

                            bot.rl.on('line', (input) => {
                                if (input != '') {
                                    botkit.receive(bot, {
                                        text: input,
                                        user: 'console',
                                        channel: 'console',
                                    });
                                }

                                // bot.rl.prompt();

                            });

                            bot.send = function(message) {
                              // return new Promise(function(resolve,reject) { resolve() });
                                return new Promise(function(resolve, reject) {
                                    if (typeof(message) == 'string') {
                                        message = {
                                            text: message,
                                        }
                                    }
                                    if (message.text) {
                                        console.log('🤖 ', message.text);
                                        bot.rl.prompt();
                                    }
                                    resolve();
                                });
                            }

                            bot.reply = function(src, reply) {
                                return bot.say(reply);
                            }

                        }

                        next();
                    }
                ]
            }
        }
    }
