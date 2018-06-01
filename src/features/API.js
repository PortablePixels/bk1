var debug = require('debug')('botkit:api');


module.exports = function(botkit) {

    if (botkit.config.studio_token) {
        botkit.api = new require('botkit-studio-sdk')(botkit.config);
    }

}
