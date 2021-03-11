var debug = require('debug')('botkit:api');
var Studio = require('./studio.js');

module.exports = function(botkit) {

    if (botkit.config.studio_token) {
        botkit.api = new Studio(botkit.config);
    }

}
