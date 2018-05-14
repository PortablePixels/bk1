var debug = require('debug')('botkit:api');


module.exports = function(botkit) {

    if (botkit.config.studio_token) {
        botkit.api = new require('botkit-studio-sdk')(botkit.config);
    }


    


    // function evaluateMessage(message) {
    //     return new Promise(function(resolve, reject) {
    //         // console.log('********************************* API CALL');
    //         botkit.api.evaluateTrigger(message.text, message.user).then(function(script) {
    //             if (script) {
    //               resolve(script);
    //             }
    //         });
    //     });
    // }




}
